import assert from "node:assert/strict";
import test from "node:test";
import { gameReducer, getStats, initialGame, type SpinRecord } from "../src/lib/game/round";
import { calculateWinnings, isWinningBet } from "../src/lib/game/payouts";
import { samplePocket, spinQuantumRoulette } from "../src/lib/quantum/quantum-engine";
import type { Bet } from "../src/types/game";

const red: Bet = { id: "red", type: "red", amount: 10 };

test("zero pays a straight zero bet and loses all outside bets", () => {
    const zero: Bet = { id: "zero", type: "straight", value: 0, amount: 5 };
    assert.equal(isWinningBet(red, 0), false);
    assert.deepEqual(calculateWinnings([red, zero], 0), { totalWin: 180, winningBetIds: ["zero"] });
});

test("a spin cannot settle before the wheel stops or settle twice", () => {
    let game = gameReducer(initialGame, { type: "bet", bet: red });
    game = gameReducer(game, { type: "start" });
    const settle = { type: "settle", timestamp: "2026-11-24T00:00:00Z" } as const;
    assert.equal(gameReducer(game, { type: "wheelStopped" }), game);
    game = gameReducer(game, { type: "result", result: { value: 1, bitstring: "000001", source: "simulator" } });
    assert.equal(gameReducer(game, settle), game);
    game = gameReducer(game, { type: "wheelStopped" });
    game = gameReducer(game, settle);
    assert.equal(game.balance, 1010);
    assert.equal(gameReducer(game, settle), game);
});

test("an unaffordable rebet preserves the current wager", () => {
    const game = { ...initialGame, balance: 20, currentBets: [red], lastBets: [{ ...red, amount: 35 }] };
    assert.equal(gameReducer(game, { type: "rebet" }), game);
    const affordable = { ...game, lastBets: [{ ...red, amount: 25 }] };
    const result = gameReducer(affordable, { type: "rebet" });
    assert.equal(result.currentBets[0].amount, 25);
    assert.equal(result.balance, 5);
});

test("zero is counted separately from black", () => {
    const record: SpinRecord = { value: 0, source: "simulator", timestamp: "", winAmount: 0 };
    const { redPct, blackPct, zeroPct } = getStats([record]);
    assert.deepEqual({ redPct, blackPct, zeroPct }, { redPct: 0, blackPct: 0, zeroPct: 100 });
});

test("an invalid outcome is rejected beyond the old attempt limit without changing the bits", () => {
    let attempts = 0;
    const result = samplePocket(() => ++attempts > 16 ? "100100" : "111111");
    assert.deepEqual(result, { value: 36, bitstring: "100100", attempts: 17, source: "simulator" });
});

test("hardware spins send a private access code and preserve IBM's job ID", async (context) => {
    context.mock.method(globalThis, "fetch", async (path: RequestInfo | URL, options?: RequestInit) => {
        assert.equal(path, "/api/quantum-spin");
        assert.equal(options?.method, "POST");
        assert.equal(new Headers(options?.headers).get("X-Quantum-Access"), "fake-code");
        return Response.json({ value: 1, bitstring: "000001", source: "hardware", jobId: "sample-job" });
    });
    assert.equal((await spinQuantumRoulette("hardware", "fake-code")).jobId, "sample-job");
});

test("a fallback never represents itself as an IBM job", async (context) => {
    context.mock.method(globalThis, "fetch", async () =>
        Response.json({ value: 1, bitstring: "000001", source: "pseudo-fallback", jobId: "untrusted" }));
    assert.deepEqual(await spinQuantumRoulette("hardware", "fake-code"),
        { value: 1, bitstring: "000001", source: "pseudo-fallback" });
});

test("bad hardware authorization and mismatched results fail the round", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
    await assert.rejects(spinQuantumRoulette("hardware", "bad-code"), /access code/);
    fetch.mock.mockImplementation(async () => Response.json({ value: 1, bitstring: "000011", source: "hardware", jobId: "sample-job" }));
    await assert.rejects(spinQuantumRoulette("hardware", "fake-code"), /Invalid quantum response/);
});
