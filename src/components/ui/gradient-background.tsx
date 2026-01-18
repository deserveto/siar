"use client";

import { motion } from "framer-motion";

export function GradientBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden">
            {/* Base background - Adaptive to theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted transition-colors duration-700" />

            {/* Static Dynamic Gradient - No Animation */}
            <div
                className="absolute inset-0 opacity-60 dark:opacity-40 filter blur-3xl saturate-150 transition-colors duration-700"
                style={{
                    background: `
                        radial-gradient(circle at 15% 15%, var(--gradient-1) 0%, transparent 50%),
                        radial-gradient(circle at 85% 85%, var(--gradient-2) 0%, transparent 50%),
                        radial-gradient(circle at 85% 15%, var(--gradient-3) 0%, transparent 50%),
                        radial-gradient(circle at 15% 85%, var(--gradient-1) 0%, transparent 50%)
                    `,
                    // @ts-ignore - CSS variables used in gradient
                    "--gradient-1": "hsl(var(--accent-hue), 85%, 60%)",
                    "--gradient-2": "hsl(calc(var(--accent-hue) + 45), 85%, 60%)",
                    "--gradient-3": "hsl(calc(var(--accent-hue) - 45), 85%, 60%)",
                }}
            />

            {/* Noise/Texture Overlay for premium feel */}
            <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
        </div>
    );
}
