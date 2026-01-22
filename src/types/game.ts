export type GamePhase = "idle" | "betting" | "spinning" | "collapsing" | "resolving";

export type BetType =
    | "straight" // 0-36
    | "red" | "black"
    | "even" | "odd"
    | "1st12" | "2nd12" | "3rd12"
    | "1to18" | "19to36"
    | "col1" | "col2" | "col3"; // col1=3,6,9... col2=2,5,8... col3=1,4,7...

export type ChipValue = 1 | 5 | 10 | 25 | 100;

export interface Bet {
    id: string; // unique bet id
    type: BetType;
    value?: number; // for straight bets (0-36)
    amount: number;
}

export const PAYOUTS: Record<BetType, number> = {
    straight: 35,
    red: 1,
    black: 1,
    even: 1,
    odd: 1,
    "1st12": 2,
    "2nd12": 2,
    "3rd12": 2,
    "1to18": 1,
    "19to36": 1,
    col1: 2,
    col2: 2,
    col3: 2
};
