import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

// European Roulette number sequence (clockwise)
const NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const COLORS: Record<number, string> = {
    0: "green",
};
// Assign Red/Black
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
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
    const [rotation, setRotation] = useState(0);
    const [ballRotation, setBallRotation] = useState(0);

    useEffect(() => {
        if (isSpinning && targetNumber !== null) {
            // ... (keep existing wheel logic setup) ...
            const segmentAngle = 360 / 37;
            const targetIndex = NUMBERS.indexOf(targetNumber);
            const currentAngleOfTarget = targetIndex * segmentAngle;

            // Wheel rotates Clockwise to align target to top (0deg)
            const alignRotation = (360 - currentAngleOfTarget) % 360;
            const totalRotation = rotation + (360 * 5) + alignRotation;
            const currentMod = rotation % 360;
            const diff = alignRotation - currentMod;
            const positiveDiff = diff >= 0 ? diff : 360 + diff;
            const finalRotation = rotation + (360 * 5) + positiveDiff;

            // 1. Wheel Animation
            controls.start({
                rotate: finalRotation,
                transition: {
                    duration: 5, // Longer spin
                    ease: "circOut",
                    type: "tween"
                }
            }).then(() => {
                setRotation(finalRotation);
                onSpinComplete?.();
            });

            // 2. Ball Animation (Counter-Rotating)
            // Just like wheel, accumulate rotation but in negative direction
            const finalBallRotation = ballRotation - (360 * 10);

            ballControls.start({
                rotate: finalBallRotation,
                transition: {
                    duration: 5, // Match wheel duration
                    ease: "circOut", // Same ease to sync stop
                    type: "tween"
                }
            }).then(() => {
                setBallRotation(finalBallRotation);
            });

        }
    }, [isSpinning, targetNumber, controls, ballControls]); // eslint-disable-line react-hooks/exhaustive-deps

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
