import { ChipValue } from "@/types/game";
import { motion } from "framer-motion";

interface ChipSelectorProps {
    selectedChip: ChipValue;
    onSelect: (value: ChipValue) => void;
}

const CHIPS: ChipValue[] = [1, 5, 10, 25, 100];

export function ChipSelector({ selectedChip, onSelect }: ChipSelectorProps) {
    return (
        <div className="flex flex-wrap justify-center gap-4 p-4 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
            {CHIPS.map(value => (
                <Chip
                    key={value}
                    value={value}
                    selected={selectedChip === value}
                    onClick={() => onSelect(value)}
                />
            ))}
        </div>
    );
}

function Chip({ value, selected, onClick }: { value: ChipValue, selected: boolean, onClick: () => void }) {
    const getColor = (v: number) => {
        switch (v) {
            case 1: return "bg-gray-200 text-black border-white";
            case 5: return "bg-neon-red text-white border-red-300";
            case 10: return "bg-neon-blue text-white border-blue-300";
            case 25: return "bg-neon-green text-black border-green-300";
            case 100: return "bg-neon-gold text-black border-yellow-200";
            default: return "bg-white";
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`
                relative w-12 h-12 rounded-full flex items-center justify-center font-bold font-mono text-sm border-2 shadow-lg
                ${getColor(value)}
                ${selected ? "ring-4 ring-white/50 scale-110 z-10" : "opacity-80 grayscale-[0.3] hover:grayscale-0"}
                transition-all duration-200
            `}
        >
            <div className="absolute inset-0 rounded-full border border-dashed border-black/30 m-1" />
            <span className="relative z-10">{value}</span>
        </motion.button>
    );
}
