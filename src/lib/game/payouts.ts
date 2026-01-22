import { Bet, PAYOUTS, BetType } from "@/types/game";

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

/**
 * Checks if a specific bet wins based on the roulette result.
 */
export function isWinningBet(bet: Bet, resultValue: number): boolean {
    if (resultValue === 0) {
        // Only straight bet on 0 wins. 
        // Note: In some rules outside bets might return half, but standard American/European usually lose.
        // We'll stick to standard: 0 loses all outside bets.
        return bet.type === "straight" && bet.value === 0;
    }

    switch (bet.type) {
        case "straight":
            return bet.value === resultValue;
        case "red":
            return RED_NUMBERS.includes(resultValue);
        case "black":
            return !RED_NUMBERS.includes(resultValue);
        case "even":
            return resultValue % 2 === 0;
        case "odd":
            return resultValue % 2 !== 0;
        case "1to18":
            return resultValue >= 1 && resultValue <= 18;
        case "19to36":
            return resultValue >= 19 && resultValue <= 36;
        case "1st12":
            return resultValue >= 1 && resultValue <= 12;
        case "2nd12":
            return resultValue >= 13 && resultValue <= 24;
        case "3rd12":
            return resultValue >= 25 && resultValue <= 36;
        case "col1": // 3, 6, 9...
            return resultValue !== 0 && resultValue % 3 === 0;
        case "col2": // 2, 5, 8... -> remainder 2
            return resultValue % 3 === 2;
        case "col3": // 1, 4, 7... -> remainder 1
            return resultValue % 3 === 1;
        default:
            return false;
    }
}

/**
 * Calculates total payout for a list of bets and a result.
 * Returns { totalWin, winningBets }
 */
export function calculateWinnings(bets: Bet[], resultValue: number): { totalWin: number, winningBetIds: string[] } {
    let totalWin = 0;
    const winningBetIds: string[] = [];

    bets.forEach(bet => {
        if (isWinningBet(bet, resultValue)) {
            // Payout = Original Stake + (Stake * Multiplier)
            // e.g. Bet 10 on Red (1:1). Win = 10 + 10 = 20 total returned.
            // Usually "Payout" refers to the profit. 
            // The balance update should be: Balance = Balance + Stake + Profit.
            // Or if we deducted stake already: Balance = Balance + (Stake * (Payout+1)).

            const multiplier = PAYOUTS[bet.type];
            const profit = bet.amount * multiplier;
            const returns = bet.amount + profit;

            totalWin += returns;
            winningBetIds.push(bet.id);
        }
    });

    return { totalWin, winningBetIds };
}
