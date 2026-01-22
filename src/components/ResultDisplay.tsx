import { motion } from "framer-motion";
import { QuantumSpinResult } from "@/lib/quantum/quantum-engine";

interface ResultDisplayProps {
    result: QuantumSpinResult | null;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function ResultDisplay({ result }: ResultDisplayProps) {
    if (!result) return <div className="h-24" />; // Spacer

    const isRed = RED_NUMBERS.includes(result.value);
    const isGreen = result.value === 0;
    const colorClass = isGreen ? "text-neon-green" : isRed ? "text-neon-red" : "text-white";
    const bgClass = isGreen ? "bg-neon-green/20 border-neon-green" : isRed ? "bg-neon-red/20 border-neon-red" : "bg-white/20 border-white";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`
        flex flex-col items-center justify-center p-6 rounded-xl border-2 backdrop-blur-md
        ${bgClass} shadow-[0_0_30px_currentColor]
      `}
        >
            <div className="text-sm uppercase tracking-widest text-white/70 mb-2">Result</div>
            <div className={`text-6xl font-black ${colorClass} drop-shadow-lg`}>
                {result.value}
            </div>
            <div className="text-xs font-mono mt-2 opacity-80">
                {isGreen ? "ZERO" : isRed ? "RED" : "BLACK"}
            </div>
        </motion.div>
    );
}
