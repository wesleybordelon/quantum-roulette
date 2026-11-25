"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { gameReducer, getStats, initialGame } from "@/lib/game/round";
import { spinQuantumRoulette, type SpinMode } from "@/lib/quantum/quantum-engine";
import type { BetType, ChipValue } from "@/types/game";

export function useGameEngine() {
    const [game, dispatch] = useReducer(gameReducer, initialGame);
    const requesting = useRef(false);
    const stats = useMemo(() => getStats(game.history), [game.history]);

    useEffect(() => {
        if (game.phase === "collapsing") {
            const timeout = window.setTimeout(() => dispatch({ type: "settle", timestamp: new Date().toISOString() }), 2000);
            return () => window.clearTimeout(timeout);
        }
        if (game.phase === "resolving") {
            const timeout = window.setTimeout(() => dispatch({ type: "finished" }), 3000);
            return () => window.clearTimeout(timeout);
        }
    }, [game.phase]);

    const runGameLoop = async (mode: SpinMode, accessCode: string) => {
        if (game.phase !== "betting" || game.currentBets.length === 0 || requesting.current) return;
        requesting.current = true;
        dispatch({ type: "start" });
        try {
            dispatch({ type: "result", result: await spinQuantumRoulette(mode, accessCode) });
        } catch (error) {
            const message = error instanceof Error ? error.message : "The spin could not start. Try again.";
            dispatch({ type: "failed", message });
        } finally {
            requesting.current = false;
        }
    };

    const finishWheel = useCallback(() => dispatch({ type: "wheelStopped" }), []);

    return {
        ...game,
        stats,
        placeBet: (type: BetType, value: number | undefined, amount: ChipValue) =>
            dispatch({ type: "bet", bet: { id: String(Math.random()), type, value, amount } }),
        clearBets: () => dispatch({ type: "clear" }),
        rebet: () => dispatch({ type: "rebet" }),
        runGameLoop,
        finishWheel,
    };
}
