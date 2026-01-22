import { motion } from "framer-motion";

interface SpinButtonProps {
    onClick: () => void;
    disabled: boolean;
    label?: string;
}

export function SpinButton({ onClick, disabled, label }: SpinButtonProps) {
    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.05, textShadow: "0 0 8px rgb(255,255,255)" } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`
        relative px-12 py-4 rounded-full font-bold text-xl tracking-widest uppercase
        transition-all duration-300
        ${disabled
                    ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                    : "bg-black text-neon-pink border-2 border-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_40px_rgba(255,0,255,0.6)] hover:bg-neon-pink/10"
                }
      `}
        >
            {label || (disabled ? "Spinning..." : "SPIN")}

            {/* Glow layers */}
            {!disabled && (
                <div className="absolute inset-0 rounded-full blur-md bg-neon-pink/20 -z-10" />
            )}
        </motion.button>
    );
}
