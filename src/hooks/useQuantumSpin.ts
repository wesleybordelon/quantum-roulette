"use client";

import { useState, useCallback } from "react";
import { spinQuantumRoulette, QuantumSpinResult } from "@/lib/quantum/quantum-engine";

export interface QuantumSpinHook {
    spin: (mode?: "simulated" | "hardware") => Promise<QuantumSpinResult>;
    result: QuantumSpinResult | null;
    isCalculating: boolean;
    error: string | null;
}

export function useQuantumSpin(): QuantumSpinHook {
    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<QuantumSpinResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const spin = useCallback(async (mode: "simulated" | "hardware" = "simulated") => {
        setIsCalculating(true);
        setError(null);
        setResult(null);

        try {
            // Perform the quantum simulation or hardware fetch
            const spinResult = await spinQuantumRoulette(mode);
            setResult(spinResult);
            return spinResult;
        } catch (e: any) {
            setError(e.message || "Quantum coherence error");
            throw e;
        } finally {
            setIsCalculating(false);
        }
    }, []);

    return {
        spin,
        result,
        isCalculating,
        error
    };
}
