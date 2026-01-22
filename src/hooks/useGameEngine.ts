"use client";

import { useState, useCallback } from "react";
import { useQuantumSpin } from "./useQuantumSpin";
import { GamePhase, Bet, ChipValue, BetType } from "@/types/game";
import { calculateWinnings } from "@/lib/game/payouts";

export interface SpinRecord {
    value: number;
    winAmount: number;
    timestamp: string;
    jobId: string;
    source: string;
}

export interface GameStats {
    hot: number[];
    cold: number[];
    redPct: number;
    blackPct: number;
}

const MAX_BET = 5000;

export function useGameEngine() {
    // Quantum Logic
    const { spin: triggerQuantumSpin, result: quantumResult } = useQuantumSpin();
    const [spinMode, setSpinMode] = useState<"simulated" | "hardware">("simulated");

    // Game State
    const [balance, setBalance] = useState(1000);
    const [currentBets, setCurrentBets] = useState<Bet[]>([]);
    const [phase, setPhase] = useState<GamePhase>("betting");
    const [lastWin, setLastWin] = useState(0);
    const [winningBetIds, setWinningBetIds] = useState<string[]>([]);

    // Expanded History & Stats
    const [history, setHistory] = useState<SpinRecord[]>([]);
    const [lastBets, setLastBets] = useState<Bet[]>([]);

    // Derived Stats (Memoize if expensive, but 500 items is cheap for JS)
    const stats: GameStats = (() => {
        if (history.length === 0) return { hot: [], cold: [], redPct: 0, blackPct: 0 };

        const counts: Record<number, number> = {};
        let reds = 0;
        const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

        history.forEach(h => {
            counts[h.value] = (counts[h.value] || 0) + 1;
            if (RED_NUMBERS.includes(h.value)) reds++;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const hot = sorted.slice(0, 3).map(s => parseInt(s[0]));

        // Cold: Only consider numbers that have appeared 0 times? Or just least frequent from those that appeared?
        // True cold numbers includes those with 0 hits.
        // Let's find least frequent among numbers 0-36.
        const allCounts: [number, number][] = [];
        for (let i = 0; i <= 36; i++) {
            allCounts.push([i, counts[i] || 0]);
        }
        allCounts.sort((a, b) => a[1] - b[1]); // Ascending
        const cold = allCounts.slice(0, 3).map(s => s[0]);

        return {
            hot,
            cold,
            redPct: Math.round((reds / history.length) * 100),
            blackPct: 100 - Math.round((reds / history.length) * 100)
        };
    })();

    // Actions
    const toggleSpinMode = useCallback(() => {
        setSpinMode(prev => prev === "simulated" ? "hardware" : "simulated");
    }, []);

    const placeBet = useCallback((type: BetType, value: number | undefined, amount: ChipValue) => {
        if (phase !== "betting") return;

        // Max Bet Check
        const currentTotal = currentBets.reduce((sum, b) => sum + b.amount, 0);
        if (currentTotal + amount > MAX_BET) {
            // Optional: Alert or Audio feedback
            console.warn("Max bet reached");
            return;
        }

        if (balance < amount) return;

        setBalance(prev => prev - amount);

        const newBet: Bet = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            value,
            amount
        };

        setCurrentBets(prev => [...prev, newBet]);
    }, [balance, phase, currentBets]);

    const clearBets = useCallback(() => {
        if (phase !== "betting") return;
        const totalBetAmount = currentBets.reduce((sum, bet) => sum + bet.amount, 0);
        setBalance(prev => prev + totalBetAmount);
        setCurrentBets([]);
    }, [phase, currentBets]);

    const rebet = useCallback(() => {
        if (phase !== "betting") return;
        if (lastBets.length === 0) return;
        if (currentBets.length > 0) clearBets();

        const totalNeeded = lastBets.reduce((sum, b) => sum + b.amount, 0);
        if (totalNeeded > MAX_BET) return; // Basic check

        if (balance < totalNeeded) return;

        setBalance(prev => prev - totalNeeded);

        const betsToAdd = lastBets.map(b => ({
            ...b,
            id: Math.random().toString(36).substr(2, 9)
        }));

        setCurrentBets(prev => [...prev, ...betsToAdd]);
    }, [phase, lastBets, balance, currentBets, clearBets]);

    const runGameLoop = useCallback(async () => {
        if (phase !== "betting") return;
        if (currentBets.length === 0) return;

        setPhase("spinning");
        setLastWin(0);
        setWinningBetIds([]);
        setLastBets(currentBets);

        try {
            const resultPromise = triggerQuantumSpin(spinMode);
            const animationPromise = new Promise(resolve => setTimeout(resolve, 4000));

            const [qResult] = await Promise.all([resultPromise, animationPromise]);

            setPhase("collapsing");
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { totalWin, winningBetIds: winners } = calculateWinnings(currentBets, qResult.value);

            setPhase("resolving");
            setLastWin(totalWin);
            setWinningBetIds(winners);
            setBalance(prev => prev + totalWin);

            // Add to history with full proof data
            const newRecord: SpinRecord = {
                value: qResult.value,
                winAmount: totalWin,
                timestamp: qResult.timestamp || new Date().toISOString(),
                jobId: qResult.jobId || "SIM-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                source: qResult.source || "simulator"
            };

            setHistory(prev => [newRecord, ...prev].slice(0, 500)); // Keep last 500 for stats

            await new Promise(resolve => setTimeout(resolve, 3000));

            setPhase("betting");
            setCurrentBets([]);

        } catch (e) {
            console.error("Game Loop Error", e);
            setPhase("betting");
        }
    }, [phase, currentBets, triggerQuantumSpin, spinMode]);

    return {
        balance,
        currentBets,
        phase,
        lastWin,
        winningBetIds,
        quantumResult,
        placeBet,
        clearBets,
        rebet,
        runGameLoop,
        history,
        stats,
        spinMode,
        toggleSpinMode,
        lastBets,
        MAX_BET
    };
}
