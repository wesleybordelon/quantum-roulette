"use client";

import { useState, useCallback } from "react";
import { spinQuantumRoulette, QuantumSpinResult } from "@/lib/quantum/quantum-engine";

export type SpinState = "IDLE" | "SPINNING" | "COLLAPSED";

export function useQuantumRoulette() {
    const [spinState, setSpinState] = useState<SpinState>("IDLE");
    const [result, setResult] = useState<QuantumSpinResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Triggers the quantum spin.
     * - Sets state to SPINNING
     * - Calls the quantum engine
     * - Sets result immediately (so wheel knows target)
     * - Waits for animation time (4s)
     * - Sets state to COLLAPSED
     */
    const spin = useCallback(async () => {
        if (spinState === "SPINNING") return;

        setSpinState("SPINNING");
        setResult(null);
        setError(null);

        try {
            // 1. Start the "quantum" calculation
            const spinResult = await spinQuantumRoulette();

            // 2. Set result immediately so the wheel knows where to land
            setResult(spinResult);

            // 3. Wait for animation duration (matched to RouletteWheel duration)
            // The wheel takes ~4s to settle.
            await new Promise((resolve) => setTimeout(resolve, 4500)); // Buffer 4.5s

            setSpinState("COLLAPSED");
        } catch (err) {
            console.error("Spin failed:", err);
            setError("Quantum coherence lost. Please try again.");
            setSpinState("IDLE");
        }
    }, [spinState]);

    const reset = useCallback(() => {
        setSpinState("IDLE");
        setResult(null);
        setError(null);
    }, []);

    return {
        spin,
        reset,
        spinState,
        result,
        error,
    };
}
