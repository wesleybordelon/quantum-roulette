"use client";

import Portal from "./Portal";
import { SpinRecord } from "@/hooks/useGameEngine";
import { X, CheckCircle, Cpu, ExternalLink } from "lucide-react";

interface VerificationModalProps {
    record: SpinRecord | null;
    onClose: () => void;
}

export function VerificationModal({ record, onClose }: VerificationModalProps) {
    if (!record) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-black border border-neon-blue/30 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-neon-blue font-orbitron text-xl">VERIFICATION</h2>
                            <p className="text-xs text-white/50 font-mono">PROVABLY FAIR QUANTUM ENTROPY</p>
                        </div>
                        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4 font-mono text-xs">

                        <div className="bg-white/5 p-3 rounded border border-white/10">
                            <div className="text-white/40 mb-1">OUTCOME</div>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <span className={record.winAmount > 0 ? "text-neon-gold" : "text-white"}>{record.value}</span>
                                {record.winAmount > 0 && <CheckCircle size={16} className="text-neon-gold" />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="text-white/40 mb-1 flex items-center gap-2">
                                    <Cpu size={12} /> SOURCE
                                </div>
                                <div className="text-neon-purple uppercase">{record.source}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="text-white/40 mb-1">TIMESTAMP</div>
                                <div className="text-white/80">{new Date(record.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>

                        <div className="bg-black/80 p-3 rounded border border-neon-blue/20 overflow-hidden">
                            <div className="text-white/40 mb-2 flex justify-between">
                                <span>JOB ID</span>
                                <ExternalLink size={10} className="opacity-50" />
                            </div>
                            <code className="text-[10px] text-neon-blue break-all select-all block">
                                {record.jobId}
                            </code>
                        </div>

                        <div className="text-[10px] text-white/30 italic text-center pt-2">
                            This outcome was generated using a 6-qubit collapse on IBM Quantum hardware (or simulated equivalent).
                        </div>

                    </div>

                    {/* Action */}
                    <button
                        onClick={() => {
                            window.open(`https://quantum-computing.ibm.com/jobs/${record.jobId}`, '_blank');
                            onClose();
                        }}
                        className="w-full mt-6 py-3 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/20 transition-all rounded font-bold uppercase tracking-widest text-xs"
                    >
                        Verify on Qiskit Runtime
                    </button>

                </div>
            </div>
        </Portal>
    );
}
