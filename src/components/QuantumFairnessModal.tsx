import { motion, AnimatePresence } from "framer-motion";
import { Info, ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import Portal from "./Portal";

export function QuantumFairnessModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[0.625rem] items-center text-white/60 hover:text-white transition-colors uppercase font-mono tracking-wider ml-auto"
            >
                <ShieldCheck className="w-3 h-3" />
                <span>Quantum Fairness</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                            onClick={() => setIsOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-gray-900 border border-neon-blue/50 p-6 rounded-xl max-w-sm w-full shadow-[0_0_50px_rgba(0,255,255,0.4)] relative overflow-y-auto max-h-[90vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-neon-blue font-orbitron text-lg mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    Fair Play Protocol
                                </h3>

                                <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-mono">
                                    <p>
                                        This game utilizes <strong>True Quantum Randomness</strong> derived from two distinct sources depending on your selected mode:
                                    </p>

                                    <div className="space-y-2">
                                        <div className="bg-black/50 p-3 rounded border border-neon-blue/20">
                                            <div className="text-neon-blue text-xs font-bold mb-1 uppercase">Simulated Mode</div>
                                            <p className="text-[0.6875rem] opacity-70">
                                                A local 6-qubit quantum simulation run in your browser. Outcomes are determined by measuring a uniform superposition of 64 states.
                                            </p>
                                        </div>

                                        <div className="bg-black/50 p-3 rounded border border-neon-pink/20">
                                            <div className="text-neon-pink text-xs font-bold mb-1 uppercase">Hardware Mode</div>
                                            <p className="text-[0.6875rem] opacity-70">
                                                Entropy is sourced from real **IBM Quantum** hardware backends. Results are fetched via high-performance batching to ensure zero-latency gameplay.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-black/50 p-3 rounded border border-neon-yellow/10 mt-4">
                                        <div className="flex items-center gap-2 text-neon-yellow text-[0.625rem] mb-1 font-bold uppercase">
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Rejection Sampling</span>
                                        </div>
                                        <p className="text-[0.625rem] opacity-60 italic">
                                            The quantum state space spans 0-63. If a measurement {">"} 36 occurs, it is rejected and re-measured instantly, ensuring a perfectly fair 1/37 probability for every roulette slot.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="mt-6 w-full py-2 bg-neon-blue/20 hover:bg-neon-blue/40 border border-neon-blue text-neon-blue font-bold rounded uppercase tracking-widest text-xs transition-colors shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                                >
                                    Acknowledge
                                </button>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}
