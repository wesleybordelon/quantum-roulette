import { Cpu } from "lucide-react";
import { SOURCE_LABELS, type QuantumSpinResult } from "@/lib/quantum/quantum-engine";
import { GamePhase } from "@/types/game";
import { useEffect, useState } from "react";

interface QuantumCircuitSimulatorProps {
    phase: GamePhase;
    result: QuantumSpinResult | null;
}

export function QuantumCircuitSimulator({ phase, result }: QuantumCircuitSimulatorProps) {
    // We want to visualize sequential collapse when in 'collapsing' phase
    const [displayedBitstring, setDisplayedBitstring] = useState("000000");

    // Handle "Collapsing" animation
    useEffect(() => {
        if (phase === "collapsing" && result) {
            // Animate reveal q5 -> q0 over 2 seconds
            const targetParams = result.bitstring; // e.g. "101010"

            let step = 0;
            const interval = setInterval(() => {
                if (step >= 6) {
                    clearInterval(interval);
                    setDisplayedBitstring(targetParams);
                    return;
                }

                // Qubits are 0-indexed from right? No, typically string index 0 is left.
                // Let's reveal Left to Right (q5 down to q0 if Big Endian).

                const revealedPart = targetParams.substring(0, step + 1);
                const padding = ".".repeat(5 - step);
                setDisplayedBitstring(revealedPart + padding);

                step++;
            }, 300); // 300ms * 6 = 1.8s

            return () => clearInterval(interval);
        }
    }, [phase, result]);

    // Randomizing for "Spinning"
    useEffect(() => {
        if (phase === "spinning") {
            const interval = setInterval(() => {
                // Generate random bitstring
                const rand = Math.floor(Math.random() * 64).toString(2).padStart(6, '0');
                setDisplayedBitstring(rand);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [phase]);

    const getStatusText = () => {
        switch (phase) {
            case "idle": return "SYSTEM STANDBY";
            case "betting": return "READY TO INITIALIZE";
            case "spinning": return "SUPERPOSITION ACTIVE";
            case "collapsing": return "MEASURING EIGENSTATES...";
            case "resolving": return "WAVEFUNCTION COLLAPSED";
            default: return "";
        }
    };

    return (
        <div className="bg-black/80 border-2 border-neon-blue rounded-xl p-4 w-full relative overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <Cpu className={`text-neon-pink w-5 h-5 ${phase === "spinning" ? "animate-pulse" : ""}`} />
                <h2 className="text-neon-blue font-orbitron text-sm tracking-widest uppercase">Quantum Entropy Engine</h2>
            </div>

            {/* Circuit Visuals */}
            <div className="space-y-4">
                {/* Qubit Rows */}
                <div className="flex justify-between px-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full border border-neon-purple flex items-center justify-center transition-all duration-300 ${phase === "spinning" ? "bg-neon-purple/20 animate-pulse" : "bg-black"}`}>
                                <span className="text-xs text-white/50 font-mono">q{5 - i}</span>
                            </div>
                            <div className={`h-12 w-0.5 ${phase === "spinning" ? "bg-neon-pink animate-pulse" : "bg-white/10"}`} />
                            <div className={`h-6 w-6 border border-white/20 flex items-center justify-center text-[0.625rem] text-white font-mono ${phase === "spinning" ? "bg-neon-pink/50 text-black border-neon-pink" : ""}`}>
                                H
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Display */}
                <div className="bg-black/50 p-3 rounded border border-white/5 flex flex-col items-center justify-between min-h-[3.75rem]">
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-[0.625rem] text-white/50 uppercase font-mono">Status</span>
                        <span className={`text-[0.625rem] font-bold font-mono ${phase === "spinning" ? "text-neon-yellow animate-pulse" : "text-neon-green"}`}>
                            {getStatusText()}
                        </span>
                    </div>

                    {/* Main Bitstring Display */}
                    <div className="font-mono text-xl md:text-2xl text-white tracking-[0.5em] text-center w-full my-2">
                        |{phase === "idle" || phase === "betting" ? "000000" : displayedBitstring}⟩
                    </div>

                    {/* Entropy/Attempts info */}
                    {result && (phase === "resolving" || phase === "collapsing") && (
                        <div className="w-full flex justify-between text-[0.625rem] font-mono text-white/30 border-t border-white/5 pt-1 mt-1">
                            <span>{SOURCE_LABELS[result.source]}</span>
                            <span className={(result.attempts ?? 0) > 1 ? "text-neon-red" : ""}>
                                {result.source === "hardware" ? "BATCHED" : result.attempts ? "REJECTIONS: " + (result.attempts - 1) : ""}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Grid/Glow */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent_70%)]" />
        </div>
    );
}
