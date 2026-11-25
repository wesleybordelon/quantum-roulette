import { motion } from "framer-motion";
import { useState, type MouseEventHandler } from "react";
import { isWinningBet, RED_NUMBERS } from "@/lib/game/payouts";
import type { Bet, BetType, GamePhase } from "@/types/game";

interface BettingBoardProps {
    currentBets: Bet[];
    onPlaceBet: (type: BetType, value?: number) => void;
    phase: GamePhase;
}

const BOARD_ROWS = [
    { type: "col1", offset: 3 },
    { type: "col2", offset: 2 },
    { type: "col3", offset: 1 },
] as const;

const DOZENS = [
    ["1st12", "1st 12"], ["2nd12", "2nd 12"], ["3rd12", "3rd 12"],
] as const;

const OUTSIDE = [
    ["1to18", "1–18"], ["even", "EVEN"], ["red", "RED"], ["black", "BLACK"], ["odd", "ODD"], ["19to36", "19–36"],
] as const;

interface CellProps {
    label: string | number;
    accessibleName?: string;
    amount: number;
    disabled: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
    onHover?: (hovered: boolean) => void;
    style: string;
}

function BetCell({ label, accessibleName, amount, disabled, onClick, onHover, style }: CellProps) {
    return (
        <button
            type="button"
            aria-label={accessibleName}
            disabled={disabled}
            onClick={onClick}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            onFocus={() => onHover?.(true)}
            onBlur={() => onHover?.(false)}
            className={style + " relative flex items-center justify-center border text-center font-bold focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-neon-blue disabled:cursor-default"}
        >
            {label}
            {amount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} aria-hidden="true"
                    className="pointer-events-none absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-neon-gold text-[0.6rem] leading-none text-black">
                    {amount >= 1000 ? (amount / 1000).toFixed(1) + "k" : amount}
                </motion.span>
            )}
        </button>
    );
}

function cellKey(type: BetType, value?: number) {
    return type + ":" + (value ?? "");
}

export function BettingBoard({ currentBets, onPlaceBet, phase }: BettingBoardProps) {
    const [hover, setHover] = useState<BetType | null>(null);
    const disabled = phase !== "betting";
    const amounts = new Map<string, number>();
    for (const { type, value, amount } of currentBets) {
        const key = cellKey(type, value);
        amounts.set(key, (amounts.get(key) ?? 0) + amount);
    }

    const props = (type: BetType, value?: number) => ({
        amount: amounts.get(cellKey(type, value)) ?? 0,
        disabled,
        onClick: () => onPlaceBet(type, value),
        onHover: type === "straight" ? undefined : (active: boolean) => setHover(active ? type : null),
    });

    function pocketStyle(value: number) {
        if (!disabled && hover && isWinningBet({ type: hover }, value)) {
            return "border-neon-yellow bg-neon-yellow text-black";
        }
        return RED_NUMBERS.includes(value)
            ? "border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/30"
            : "border-white/20 bg-black/50 text-white hover:bg-white/10";
    }

    return (
        <div className="relative w-full max-w-full overflow-x-auto p-2">
            <div className="flex min-w-[43.75rem] select-none flex-col gap-1.5 md:gap-2 xl:min-w-full">
                <div className="flex gap-1 md:gap-1.5">
                    <BetCell label={0} accessibleName="Bet on zero"
                        style="w-8 rounded-l border-neon-green bg-neon-green/20 text-neon-green hover:bg-neon-green/40 md:w-12"
                        {...props("straight", 0)} />
                    <div className="flex flex-1 flex-col gap-1 md:gap-1.5">
                        {BOARD_ROWS.map(({ type, offset }, row) => (
                            <div key={type} className="flex h-10 gap-1 md:h-12 md:gap-1.5">
                                {Array.from({ length: 12 }, (_, column) => column * 3 + offset).map(value => (
                                    <BetCell key={value} label={value} accessibleName={"Bet on " + value}
                                        style={"flex-1 text-sm md:text-lg " + pocketStyle(value)}
                                        {...props("straight", value)} />
                                ))}
                                <BetCell label="2 to 1" accessibleName={"Column " + (row + 1) + ", pays 2 to 1"}
                                    style="w-8 border-white/20 bg-white/5 text-[0.55rem] text-white hover:bg-white/10 md:w-12"
                                    {...props(type)} />
                            </div>
                        ))}
                    </div>
                </div>
                {[DOZENS, OUTSIDE].map((row, index) => (
                    <div key={index} className="flex h-8 gap-1 px-8 md:h-10 md:gap-1.5 md:px-12">
                        {row.map(([type, label]) => (
                            <BetCell key={type} label={label}
                                style={"flex-1 border-white/20 text-xs hover:bg-white/10 " +
                                    (type === "red" ? "bg-neon-red/20 text-neon-red" : "bg-white/5 text-white")}
                                {...props(type)} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
