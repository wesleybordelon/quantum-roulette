"use client";

import { RED_NUMBERS } from "@/lib/game/payouts";

interface StatsPanelProps {
    hot: number[];
    cold: number[];
    redPct: number;
    blackPct: number;
    zeroPct: number;
}

export function StatsPanel({ hot, cold, redPct, blackPct, zeroPct }: StatsPanelProps) {
    return (
        <div className="flex flex-col gap-3 p-3 bg-black/40 border border-white/5 rounded-xl text-[0.6rem] font-mono w-full">
            <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-1">
                <span>STATS (LAST 500)</span>
            </div>

            <div className="flex gap-6">
                {/* Hot Numbers */}
                <div className="flex-1">
                    <div className="text-neon-gold mb-1">HOT</div>
                    <div className="flex gap-1">
                        {hot.map(n => (
                            <NumberBadge key={n} number={n} />
                        ))}
                    </div>
                </div>

                {/* Cold Numbers */}
                <div className="flex-1">
                    <div className="text-neon-blue mb-1">COLD</div>
                    <div className="flex gap-1">
                        {cold.map(n => (
                            <NumberBadge key={n} number={n} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Red/Black Bar */}
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden flex mt-1">
                <div className="h-full bg-neon-red shadow-[0_0_5px_currentColor]" style={{ width: `${redPct}%` }} />
                <div className="h-full bg-white/20" style={{ width: `${blackPct}%` }} />
                <div className="h-full bg-neon-green" style={{ width: `${zeroPct}%` }} />
            </div>
            <div className="flex justify-between text-white/30 text-[0.5rem]">
                <span>RED {Math.round(redPct)}%</span>
                <span>ZERO {Math.round(zeroPct)}%</span>
                <span>BLACK {Math.round(blackPct)}%</span>
            </div>
        </div>
    );
}

function NumberBadge({ number }: { number: number }) {
    const isRed = RED_NUMBERS.includes(number);
    const borderColor = number === 0 ? "border-neon-green text-neon-green" : isRed ? "border-neon-red text-neon-red" : "border-white text-white";

    return (
        <div className={`w-5 h-5 rounded-full border ${borderColor} flex items-center justify-center bg-black/50 text-[0.5rem] font-bold`}>
            {number}
        </div>
    );
}
