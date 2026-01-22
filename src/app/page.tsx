"use client";

import { useEffect, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { QuantumCircuitSimulator } from "@/components/QuantumCircuitSimulator";
import { RouletteWheel } from "@/components/RouletteWheel";
import { SpinButton } from "@/components/SpinButton";
import { ResultDisplay } from "@/components/ResultDisplay";
import { BettingBoard } from "@/components/betting/BettingBoard";
import { ChipSelector } from "@/components/betting/ChipSelector";
import { QuantumFairnessModal } from "@/components/QuantumFairnessModal";
import { Volume2, VolumeX, Coins } from "lucide-react";
import { ChipValue } from "@/types/game";
import { RED_NUMBERS } from "@/lib/game/payouts";
import { WinParticles } from "@/components/WinParticles";
import { StatsPanel } from "@/components/StatsPanel";
import { VerificationModal } from "@/components/VerificationModal";
import { SpinRecord } from "@/hooks/useGameEngine";

export default function Home() {
  const {
    balance,
    currentBets,
    phase,
    lastWin,
    winningBetIds,
    quantumResult,
    placeBet,
    runGameLoop,
    clearBets,
    history,
    spinMode,
    toggleSpinMode,
    rebet,
    lastBets,
    stats
  } = useGameEngine();

  const { playSound, isMuted, setIsMuted } = useSoundEffects();
  const [selectedChip, setSelectedChip] = useState<ChipValue>(10);
  const [selectedRecord, setSelectedRecord] = useState<SpinRecord | null>(null);

  // Sound triggers
  useEffect(() => {
    if (phase === "spinning") playSound("spin");
    if (phase === "collapsing") playSound("collapse");
    if (phase === "resolving") {
      if (lastWin > 0) playSound("win");
      else playSound("lose");
    }
  }, [phase, lastWin, playSound]);

  const handlePlaceBet = (type: any, value: any) => {
    if (balance < selectedChip) return; // Optional visual feedback
    playSound("chip");
    placeBet(type, value, selectedChip);
  };

  const handleSpin = () => {
    playSound("click");
    runGameLoop();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 to-black">

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            QUANTUM ROULETTE
          </h1>
          <div className="px-2 py-0.5 rounded border border-neon-blue/30 text-[0.625rem] text-neon-blue font-mono">V2.0</div>
        </div>

        <div className="flex items-center gap-6">
          {/* Mode Toggle */}
          <div className="hidden md:flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => spinMode !== "simulated" && toggleSpinMode()}
              className={`px-3 py-1 rounded text-[0.625rem] font-bold transition-all ${spinMode === "simulated" ? "bg-neon-blue text-black shadow-[0_0_10px_rgba(0,255,255,0.5)]" : "text-white/40 hover:text-white"}`}
            >
              SIMULATED
            </button>
            <button
              onClick={() => spinMode !== "hardware" && toggleSpinMode()}
              className={`px-3 py-1 rounded text-[0.625rem] font-bold transition-all ${spinMode === "hardware" ? "bg-neon-pink text-black shadow-[0_0_10px_rgba(255,0,255,0.5)]" : "text-white/40 hover:text-white"}`}
            >
              HARDWARE
            </button>
          </div>

          <div className="flex items-center gap-2 text-neon-gold font-mono text-xl font-bold bg-black/40 px-4 py-2 rounded-full border border-neon-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Coins className="w-5 h-5" />
            <span>${balance.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <QuantumFairnessModal />
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 max-w-[100rem] mx-auto w-full">

        {/* LEFT COLUMN: GAMEPLAY */}
        <div className="flex flex-col gap-8 items-center relative">

          {/* WHEEL SECTION */}
          <div className="relative w-full max-w-[31.25rem] aspect-square flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-neon-blue/5 rounded-full blur-3xl animate-pulse" />

            <RouletteWheel
              targetNumber={quantumResult?.value ?? null}
              isSpinning={phase === "spinning"}
            />

            {/* Result Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              {(phase === "resolving" && quantumResult) && (
                <div className="scale-150">
                  <ResultDisplay result={quantumResult} />
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col items-center gap-4 w-full max-w-4xl z-10">
            <div className="flex items-center gap-4 w-full justify-center">
              <ChipSelector selectedChip={selectedChip} onSelect={setSelectedChip} />
              <SpinButton
                onClick={handleSpin}
                disabled={phase !== "betting" || currentBets.length === 0}
                label={currentBets.length === 0 ? "PLACE BETS" : phase === "spinning" || phase === "collapsing" || phase === "resolving" ? "SPINNING..." : "SPIN"}
              />
              {currentBets.length > 0 && phase === "betting" && (
                <button
                  onClick={clearBets}
                  className="px-4 py-2 text-[0.625rem] text-red-400 hover:text-red-300 border border-red-500/30 rounded hover:bg-red-900/20 transition-colors uppercase font-mono tracking-widest"
                >
                  Clear
                </button>
              )}

              {currentBets.length === 0 && lastBets.length > 0 && phase === "betting" && (
                <button
                  onClick={rebet}
                  className="px-4 py-2 text-[0.625rem] text-neon-gold hover:text-yellow-200 border border-neon-gold/30 rounded hover:bg-neon-gold/10 transition-colors uppercase font-mono tracking-widest"
                >
                  Rebet
                </button>
              )}
            </div>

            {/* BETTING BOARD */}
            <div className="w-full bg-black/60 border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-sm overflow-hidden">
              <BettingBoard
                currentBets={currentBets}
                onPlaceBet={handlePlaceBet}
                phase={phase}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INFO & VISUALS */}
        <div className="flex flex-col gap-6">
          <QuantumCircuitSimulator phase={phase} result={quantumResult} />

          {/* Game Log / Info Panel */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex-1 min-h-[12.5rem]">
            <h3 className="text-neon-blue font-orbitron text-xs tracking-wider mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
              <span>SESSION LOG</span>
              <span className="text-[0.625rem] text-white/40">LAST {history.length}</span>
            </h3>

            {/* History Visualization */}
            {history.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto py-4 border-b border-white/5 px-2">
                {history.map((spin, i) => {
                  const num = spin.value;
                  const isWin = spin.winAmount > 0;
                  const isRed = RED_NUMBERS.includes(num);
                  const isGreen = num === 0;
                  const borderColor = isGreen ? "border-neon-green text-neon-green" : isRed ? "border-neon-red text-neon-red" : "border-white text-white";
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedRecord(spin)}
                      className={`
                                    w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 ${borderColor} 
                                    font-bold text-xs bg-black/50 shadow-[0_0_10px_rgba(0,0,0,0.5)] relative cursor-pointer hover:scale-110 transition-transform
                                    ${i === 0 ? "scale-110 ring-2 ring-white/50 z-10" : "opacity-70"}
                                `}
                    >
                      {num}
                      {/* Win/Loss Indicator */}
                      <div className={`
                          absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] border border-black
                          ${isWin ? "bg-neon-green text-black" : "bg-red-500 text-white"}
                      `}>
                        {isWin ? "✓" : "×"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 font-mono text-xs text-white/60">
              {phase === "idle" && <p>System Ready...</p>}
              {phase === "betting" && <p>Waiting for bets...</p>}
              {phase === "spinning" && <p className="text-neon-pink">Quantum State Superposition initialized...</p>}
              {phase === "collapsing" && (
                <div className="space-y-1">
                  <p className="text-neon-purple">Collapsing wavefunction...</p>
                  <p className="text-[0.625rem] text-white/30 uppercase">Entropy Source: {spinMode.toUpperCase()}</p>
                </div>
              )}
              {phase === "resolving" && lastWin > 0 && (
                <div className="space-y-1">
                  <p className="text-neon-gold text-sm">WIN DETECTED: +${lastWin}</p>
                  <p className="text-[0.625rem] text-white/30 uppercase italic">Verification: {quantumResult?.source} entropy used</p>
                </div>
              )}
              {phase === "resolving" && lastWin === 0 && (
                <div className="space-y-1">
                  <p className="text-gray-500">No payout.</p>
                  <p className="text-[0.625rem] text-white/20 uppercase italic">Source: {quantumResult?.source}</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <StatsPanel {...stats} />
        </div>
      </main>

      {/* Modals & Overlays */}
      <VerificationModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />

      {/* Win Particles */}
      <WinParticles active={phase === "resolving" && lastWin > 0} amount={lastWin} />
    </div>
  );
}
