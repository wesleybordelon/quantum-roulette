"use client";

import { useState, useCallback, useRef } from "react";

type SoundType = "click" | "chip" | "spin" | "collapse" | "win" | "lose";

export function useSoundEffects() {
    const [isMuted, setIsMuted] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            const browser = window as Window & { webkitAudioContext?: typeof globalThis.AudioContext };
            const AudioContext = window.AudioContext || browser.webkitAudioContext;
            if (AudioContext) {
                audioContextRef.current = new AudioContext();
            }
        }
        if (audioContextRef.current?.state === "suspended") {
            audioContextRef.current.resume();
        }
    }, []);

    const playSound = useCallback((type: SoundType) => {
        if (isMuted) return;
        initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            switch (type) {
                case "click":
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                case "chip":
                    // Sharper "clack"
                    osc.type = "square";
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;
                case "spin":
                    // Sci-fi power up
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.linearRampToValueAtTime(400, now + 2);

                    // LFO for texture
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.frequency.value = 15;
                    lfoGain.gain.value = 50;
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start(now);
                    lfo.stop(now + 2);

                    gain.gain.setValueAtTime(0.02, now);
                    gain.gain.linearRampToValueAtTime(0, now + 4); // Fade out longer
                    osc.start(now);
                    osc.stop(now + 4);
                    break;
                case "collapse":
                    // Digital crunch
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;
                case "win":
                    // Victory Chord (C Major 7)
                    playNote(ctx, 523.25, now, 0.4, "triangle"); // C5
                    playNote(ctx, 659.25, now + 0.1, 0.4, "triangle"); // E5
                    playNote(ctx, 783.99, now + 0.2, 0.4, "triangle"); // G5
                    playNote(ctx, 987.77, now + 0.3, 0.8, "sine"); // B5

                    // Sparkle
                    playNote(ctx, 1318.51, now + 0.4, 0.2, "sine"); // E6
                    playNote(ctx, 2093.00, now + 0.5, 0.4, "sine"); // C7
                    break;
                case "lose":
                    playNote(ctx, 150, now, 0.4, "sawtooth");
                    playNote(ctx, 140, now + 0.2, 0.4, "sawtooth");
                    break;
            }
        } catch (e) {
            console.error("Audio error", e);
        }
    }, [initAudio, isMuted]);

    return { playSound, isMuted, setIsMuted };
}

function playNote(ctx: AudioContext, freq: number, time: number, duration: number, type: OscillatorType) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // Decay

    osc.start(time);
    osc.stop(time + duration);
}
