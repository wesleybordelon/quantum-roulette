import { useEffect, useRef } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { RED_NUMBERS } from "@/lib/game/payouts";

// European Roulette number sequence (clockwise)
const NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const COLORS: Record<number, string> = {
    0: "green",
};
// Assign Red/Black
NUMBERS.forEach(n => {
    if (n !== 0) {
        COLORS[n] = RED_NUMBERS.includes(n) ? "red" : "black";
    }
});

interface RouletteWheelProps {
    isSpinning: boolean;
    targetNumber: number | null;
    onSpinComplete?: () => void;
}

export function RouletteWheel({ isSpinning, targetNumber, onSpinComplete }: RouletteWheelProps) {
    const controls = useAnimation();
    const ballControls = useAnimation();
    const rotation = useRef(0);
    const ballRotation = useRef(0);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (!isSpinning || targetNumber === null) return;

        const segmentAngle = 360 / 37;
        const alignRotation = (360 - NUMBERS.indexOf(targetNumber) * segmentAngle) % 360;
        const turn = (alignRotation - rotation.current % 360 + 360) % 360;
        const finalRotation = rotation.current + 360 * 5 + turn;
        const finalBallRotation = ballRotation.current - 360 * 10;
        const duration = reduceMotion ? 0 : 5;
        const transition = { duration, ease: "circOut" } as const;
        let cancelled = false;

        void Promise.all([
            controls.start({ rotate: finalRotation, transition }),
            ballControls.start({ rotate: finalBallRotation, transition }),
        ]).then(() => {
            if (cancelled) return;
            rotation.current = finalRotation;
            ballRotation.current = finalBallRotation;
            onSpinComplete?.();
        });

        return () => {
            cancelled = true;
            controls.stop();
            ballControls.stop();
        };
    }, [isSpinning, targetNumber, controls, ballControls, onSpinComplete, reduceMotion]);

    return (
        <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-4 border-neon-gold shadow-[0_0_50px_rgba(255,215,0,0.2)] bg-black flex items-center justify-center overflow-hidden">
            {/* Pointer (Triangle) */}
            <div className="absolute top-0 z-20 w-4 h-8 bg-neon-gold shadow-[0_0_10px_gold] clip-triangle translate-y-[-50%] pointer-events-none" />

            {/* Wheel Container */}
            <motion.div
                className="w-full h-full relative"
                animate={controls}
                initial={{ rotate: 0 }}
            >
                {/* Segments */}
                {NUMBERS.map((num, i) => {
                    const angle = (360 / 37) * i;
                    const color = COLORS[num];
                    return (
                        <div
                            key={num}
                            className="absolute w-full h-full left-0 top-0"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            {/* Slice */}
                            <div
                                className="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-1/2 origin-bottom flex justify-center pt-2"
                            >
                                <span
                                    className={`font-bold text-sm ${color === 'red' ? 'text-neon-red' :
                                        color === 'black' ? 'text-white' : 'text-neon-green'
                                        }`}
                                    style={{ transform: 'rotate(0deg)' }}
                                >
                                    {num}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Conic Gradient for background colors */}
                <div
                    className="absolute inset-0 rounded-full opacity-50 pointer-events-none"
                    style={{
                        background: `conic-gradient(
                        ${NUMBERS.map((n, i) => {
                            const start = (i / 37) * 100;
                            const end = ((i + 1) / 37) * 100;
                            const c = COLORS[n] === 'red' ? '#ff0000' : COLORS[n] === 'black' ? '#000000' : '#00ff00';
                            return `${c} ${start}% ${end}%`;
                        }).join(', ')}
                    )`
                    }}
                />
            </motion.div>

            {/* Ball Track & Ball */}
            <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                animate={ballControls}
                initial={{ rotate: 0 }}
            >
                {/* Ball Positioned at Top (0deg) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white,inset_-1px_-1px_3px_rgba(0,0,0,0.2)]" />
            </motion.div>

            {/* Center Cap */}
            <div className="absolute z-10 w-16 h-16 bg-gradient-to-br from-neon-gold to-yellow-900 rounded-full shadow-inner flex items-center justify-center">
                <span className="text-black font-bold text-xs">Q-CASINO</span>
            </div>
        </div>
    );
}
