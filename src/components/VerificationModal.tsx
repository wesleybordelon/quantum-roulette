"use client";

import { X } from "lucide-react";
import Portal from "./Portal";
import type { SpinRecord } from "@/lib/game/round";
import { SOURCE_LABELS } from "@/lib/quantum/quantum-engine";

interface VerificationModalProps {
    record: SpinRecord | null;
    onClose: () => void;
}

export function VerificationModal({ record, onClose }: VerificationModalProps) {
    if (!record) return null;
    const jobId = record.source === "hardware" ? record.jobId : undefined;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
                <section aria-labelledby="spin-details" className="relative w-full max-w-md rounded-2xl border border-neon-blue/30 bg-black p-6">
                    <div className="mb-6 flex justify-between">
                        <h2 id="spin-details" className="font-orbitron text-xl text-neon-blue">Spin details</h2>
                        <button type="button" onClick={onClose} aria-label="Close spin details" className="text-white/70">
                            <X size={20} />
                        </button>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 font-mono text-sm">
                        <div><dt>Outcome</dt><dd>{record.value}</dd></div>
                        <div><dt>Time</dt><dd>{new Date(record.timestamp).toLocaleTimeString()}</dd></div>
                        <div className="col-span-2"><dt>Source</dt><dd>{SOURCE_LABELS[record.source]}</dd></div>
                        {jobId && <div className="col-span-2"><dt>IBM job ID</dt><dd className="break-all text-neon-blue">{jobId}</dd></div>}
                    </dl>
                    {jobId && (
                        <a href="https://quantum.cloud.ibm.com/workloads" target="_blank" rel="noopener noreferrer"
                            className="mt-6 block rounded border border-neon-blue/50 p-3 text-center text-neon-blue">
                            View IBM workloads
                        </a>
                    )}
                </section>
            </div>
        </Portal>
    );
}
