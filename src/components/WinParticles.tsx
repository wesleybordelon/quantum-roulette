"use client";

import { useEffect, useRef } from "react";

interface WinParticlesProps {
    active: boolean;
    amount?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
}

export function WinParticles({ active, amount = 0 }: WinParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const reqIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) {
            particlesRef.current = [];
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Burst
        const colors = ["#FFA500", "#FFD700", "#FF4500", "#00FFFF", "#FF00FF"];
        const count = Math.min(200 + amount * 2, 500); // Scale with win amount

        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                size: Math.random() * 6 + 2
            });
        }

        const animate = () => {
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & Draw
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.vx *= 0.95; // Drag
                p.vy *= 0.95;
                p.life -= 0.01;

                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Sparkle
                if (Math.random() > 0.9) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(p.x, p.y, 2, 2);
                }
            }

            if (particlesRef.current.length > 0) {
                reqIdRef.current = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
        };
    }, [active, amount]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
        />
    );
}
