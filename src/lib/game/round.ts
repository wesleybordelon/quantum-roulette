import { calculateWinnings, RED_NUMBERS } from "./payouts";
import type { QuantumSpinResult } from "../quantum/quantum-engine";
import type { Bet, GamePhase } from "../../types/game";

const MAX_BET = 5000;

export interface SpinRecord {
    value: number;
    winAmount: number;
    timestamp: string;
    jobId?: string;
    source: QuantumSpinResult["source"];
}

export interface GameStats {
    hot: number[];
    cold: number[];
    redPct: number;
    blackPct: number;
    zeroPct: number;
}

interface Game {
    balance: number;
    currentBets: Bet[];
    lastBets: Bet[];
    phase: GamePhase;
    quantumResult: QuantumSpinResult | null;
    lastWin: number;
    history: SpinRecord[];
    error: string | null;
}

type Action =
    | { type: "bet"; bet: Bet }
    | { type: "clear" }
    | { type: "rebet" }
    | { type: "start" }
    | { type: "result"; result: QuantumSpinResult }
    | { type: "wheelStopped" }
    | { type: "settle"; timestamp: string }
    | { type: "finished" }
    | { type: "failed"; message: string };

export const initialGame: Game = {
    balance: 1000,
    currentBets: [],
    lastBets: [],
    phase: "betting",
    quantumResult: null,
    lastWin: 0,
    history: [],
    error: null,
};

const stake = (bets: Bet[]) => bets.reduce((total, bet) => total + bet.amount, 0);

export function gameReducer(game: Game, action: Action): Game {
    switch (action.type) {
        case "bet":
            if (game.phase !== "betting" || game.balance < action.bet.amount
                || stake(game.currentBets) + action.bet.amount > MAX_BET) return game;
            return { ...game, balance: game.balance - action.bet.amount, currentBets: [...game.currentBets, action.bet] };
        case "clear":
            if (game.phase !== "betting") return game;
            return { ...game, balance: game.balance + stake(game.currentBets), currentBets: [] };
        case "rebet": {
            if (game.phase !== "betting" || game.lastBets.length === 0) return game;
            const available = game.balance + stake(game.currentBets);
            const previous = stake(game.lastBets);
            if (previous > MAX_BET || previous > available) return game;
            return { ...game, balance: available - previous, currentBets: game.lastBets };
        }
        case "start":
            if (game.phase !== "betting" || game.currentBets.length === 0) return game;
            return { ...game, phase: "spinning", quantumResult: null, lastWin: 0, error: null };
        case "result":
            if (game.phase !== "spinning" || game.quantumResult) return game;
            return { ...game, quantumResult: action.result };
        case "wheelStopped":
            return game.phase === "spinning" && game.quantumResult ? { ...game, phase: "collapsing" } : game;
        case "settle": {
            if (game.phase !== "collapsing" || !game.quantumResult) return game;
            const { value, source, jobId } = game.quantumResult;
            const { totalWin } = calculateWinnings(game.currentBets, value);
            const record = { value, source, jobId, winAmount: totalWin, timestamp: action.timestamp };
            return {
                ...game,
                phase: "resolving",
                balance: game.balance + totalWin,
                lastWin: totalWin,
                lastBets: game.currentBets,
                history: [record, ...game.history].slice(0, 500),
            };
        }
        case "finished":
            return game.phase === "resolving" ? { ...game, phase: "betting", currentBets: [] } : game;
        case "failed":
            return game.phase === "spinning"
                ? { ...game, phase: "betting", error: action.message }
                : game;
    }
}

export function getStats(history: SpinRecord[]): GameStats {
    if (history.length === 0) return { hot: [], cold: [], redPct: 0, blackPct: 0, zeroPct: 0 };
    const counts = Array.from({ length: 37 }, (_, value) => ({ value, count: 0 }));
    let reds = 0;
    for (const { value } of history) {
        counts[value].count++;
        if (RED_NUMBERS.includes(value)) reds++;
    }
    const zeros = counts[0].count;
    const ranked = [...counts].sort((a, b) => b.count - a.count);
    const pct = (count: number) => (count * 100) / history.length;
    return {
        hot: ranked.filter(({ count }) => count > 0).slice(0, 3).map(({ value }) => value),
        cold: counts.sort((a, b) => a.count - b.count).slice(0, 3).map(({ value }) => value),
        redPct: pct(reds),
        blackPct: pct(history.length - reds - zeros),
        zeroPct: pct(zeros),
    };
}
