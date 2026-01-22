import { Bet, BetType } from "@/types/game";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface BettingBoardProps {
    currentBets: Bet[];
    onPlaceBet: (type: BetType, value?: number) => void;
    phase: string;
}

const ROWS = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // Top Row (visually)
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]  // Bottom Row
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function BettingBoard({ currentBets, onPlaceBet, phase }: BettingBoardProps) {
    const isBetting = phase === "betting";
    const [hoveredBet, setHoveredBet] = useState<BetType | null>(null);

    const handleBet = (type: BetType, value?: number) => {
        if (!isBetting) return;
        onPlaceBet(type, value);
    };

    const getChipAmountRaw = (type: BetType, value?: number) => {
        return currentBets
            .filter(b => b.type === type && b.value === value)
            .reduce((sum, b) => sum + b.amount, 0);
    };

    const isNumberHighlighted = (num: number) => {
        if (!hoveredBet) return false;

        switch (hoveredBet) {
            case "straight": return false; // Handled individually if needed, but usually hover on cell is enough
            case "red": return RED_NUMBERS.includes(num);
            case "black": return !RED_NUMBERS.includes(num) && num !== 0;
            case "even": return num !== 0 && num % 2 === 0;
            case "odd": return num !== 0 && num % 2 !== 0; // 0 is not odd or even in roulette betting
            case "1to18": return num >= 1 && num <= 18;
            case "19to36": return num >= 19 && num <= 36;
            case "1st12": return num >= 1 && num <= 12;
            case "2nd12": return num >= 13 && num <= 24;
            case "3rd12": return num >= 25 && num <= 36;
            case "col1": return num !== 0 && num % 3 === 0;   // 3, 6, 9...
            case "col2": return num % 3 === 2; // 2, 5, 8...
            case "col3": return num % 3 === 1; // 1, 4, 7...
            default: return false;
        }
    };

    const ChipOverlay = ({ type, value }: { type: BetType, value?: number }) => {
        const amount = getChipAmountRaw(type, value);
        if (amount === 0) return null;

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                    <div className="w-6 h-6 rounded-full bg-neon-gold border border-white text-[0.5625rem] md:text-[0.625rem] text-black font-bold flex items-center justify-center shadow-md leading-none">
                        {amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="relative overflow-x-auto p-2 w-full max-w-full">
            <div className="flex flex-col min-w-[43.75rem] xl:min-w-full gap-1.5 md:gap-2 select-none">
                {/* Main Grid Area */}
                <div className="flex gap-1 md:gap-1.5 align-stretch">
                    {/* Zero */}
                    <div
                        onClick={() => handleBet("straight", 0)}
                        className={`
                            w-8 md:w-12 bg-neon-green/20 border border-neon-green rounded-l hover:bg-neon-green/40 cursor-pointer
                            flex items-center justify-center relative transition-colors group
                        `}
                    >
                        <span className="group-hover:text-neon-green font-bold text-white text-sm md:text-lg rotate-[-90deg]">0</span>
                        <ChipOverlay type="straight" value={0} />
                    </div>

                    {/* Numbers Grid + Column Bets */}
                    <div className="flex flex-col gap-1 md:gap-1.5 flex-1">
                        {ROWS.map((row, rowIndex) => {
                            // Map visual rows to column logic:
                            // Row 0 (3,6,9) -> col1
                            // Row 1 (2,5,8) -> col2
                            // Row 2 (1,4,7) -> col3
                            const colType = rowIndex === 0 ? "col1" : rowIndex === 1 ? "col2" : "col3";

                            return (
                                <div key={rowIndex} className="flex gap-1 md:gap-1.5 h-10 md:h-12">
                                    {row.map(num => {
                                        const isRed = RED_NUMBERS.includes(num);
                                        const highlighted = isNumberHighlighted(num);

                                        return (
                                            <div
                                                key={num}
                                                onClick={() => handleBet("straight", num)}
                                                className={`
                                                    flex-1 border border-white/20 flex items-center justify-center text-sm md:text-lg font-bold cursor-pointer relative
                                                    ${highlighted ? "bg-neon-yellow text-black border-neon-yellow shadow-[0_0_15px_rgba(255,255,0,0.8)] z-20 scale-105 font-black" : ""}
                                                    ${!highlighted && isRed ? "bg-neon-red/10 border-neon-red/30 hover:bg-neon-red/30" : ""}
                                                    ${!highlighted && !isRed ? "bg-black/50 hover:bg-white/10" : ""}
                                                    transition-all duration-150
                                                `}
                                            >
                                                <span className={isRed ? "text-neon-red" : "text-white"}>{num}</span>
                                                <ChipOverlay type="straight" value={num} />
                                            </div>
                                        );
                                    })}

                                    {/* 2 to 1 Column Bet for this row */}
                                    <div
                                        onClick={() => handleBet(colType)}
                                        onMouseEnter={() => setHoveredBet(colType)}
                                        onMouseLeave={() => setHoveredBet(null)}
                                        className={`
                                            w-8 md:w-12 border border-white/20 flex items-center justify-center cursor-pointer relative
                                            text-[0.625rem] md:text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10
                                            transition-colors hover:border-white/50 text-white/50 hover:text-white
                                        `}
                                    >
                                        <span className="rotate-[-90deg] whitespace-nowrap text-[0.6rem]">2 to 1</span>
                                        <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] px-1 rounded -top-4 pointer-events-none whitespace-nowrap border border-white/20">
                                            PAY 2:1
                                        </div>
                                        <ChipOverlay type={colType} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Bets (Dozens) */}
                <div className="flex gap-1 md:gap-1.5 pl-8 md:pl-12 h-8 md:h-10 pr-8 md:pr-12">
                    <BettingCell label="1st 12" onClick={() => handleBet("1st12")} onHover={(h: boolean) => setHoveredBet(h ? "1st12" : null)}>
                        <ChipOverlay type="1st12" />
                        <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] px-1 rounded -top-4 pointer-events-none whitespace-nowrap border border-white/20 z-20">PAY 2:1</div>
                    </BettingCell>
                    <BettingCell label="2nd 12" onClick={() => handleBet("2nd12")} onHover={(h: boolean) => setHoveredBet(h ? "2nd12" : null)}>
                        <ChipOverlay type="2nd12" />
                        <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] px-1 rounded -top-4 pointer-events-none whitespace-nowrap border border-white/20 z-20">PAY 2:1</div>
                    </BettingCell>
                    <BettingCell label="3rd 12" onClick={() => handleBet("3rd12")} onHover={(h: boolean) => setHoveredBet(h ? "3rd12" : null)}>
                        <ChipOverlay type="3rd12" />
                        <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] px-1 rounded -top-4 pointer-events-none whitespace-nowrap border border-white/20 z-20">PAY 2:1</div>
                    </BettingCell>
                </div>

                {/* Bottom Bets (Low/High/Color) */}
                <div className="flex gap-1 md:gap-1.5 pl-8 md:pl-12 h-8 md:h-10 pr-8 md:pr-12">
                    <BettingCell label="1-18" onClick={() => handleBet("1to18")} onHover={(h: boolean) => setHoveredBet(h ? "1to18" : null)}>
                        <ChipOverlay type="1to18" />
                    </BettingCell>
                    <BettingCell label="EVEN" onClick={() => handleBet("even")} onHover={(h: boolean) => setHoveredBet(h ? "even" : null)}>
                        <ChipOverlay type="even" />
                    </BettingCell>
                    <BettingCell label="RED" color="bg-neon-red/20 text-neon-red" onClick={() => handleBet("red")} onHover={(h: boolean) => setHoveredBet(h ? "red" : null)}>
                        <ChipOverlay type="red" />
                    </BettingCell>
                    <BettingCell label="BLACK" color="bg-black/80 text-white" onClick={() => handleBet("black")} onHover={(h: boolean) => setHoveredBet(h ? "black" : null)}>
                        <ChipOverlay type="black" />
                    </BettingCell>
                    <BettingCell label="ODD" onClick={() => handleBet("odd")} onHover={(h: boolean) => setHoveredBet(h ? "odd" : null)}>
                        <ChipOverlay type="odd" />
                    </BettingCell>
                    <BettingCell label="19-36" onClick={() => handleBet("19to36")} onHover={(h: boolean) => setHoveredBet(h ? "19to36" : null)}>
                        <ChipOverlay type="19to36" />
                    </BettingCell>
                </div>
            </div>
        </div>
    );
}

function BettingCell({ label, flex = true, color, onClick, onHover, children }: any) {
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => onHover && onHover(true)}
            onMouseLeave={() => onHover && onHover(false)}
            className={`
                ${flex ? "flex-1" : ""}
                border border-white/20 flex items-center justify-center cursor-pointer relative
                text-[0.625rem] md:text-xs font-bold uppercase tracking-wider
                ${color ? color : "bg-white/5 hover:bg-white/10"}
                transition-colors hover:border-white/50 group
            `}
        >
            {label}
            {children}
        </div>
    );
}
