'use client';

import Link from "next/link";
import { GradientBackground } from "@/components/ui/gradient-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccentPicker } from "@/components/accent-picker";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <GradientBackground />

      {/* Theme Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <AccentPicker />
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        {/* SIAR Title Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1
            className="text-6xl md:text-9xl font-bold tracking-[0.15em] mb-4 text-transparent bg-clip-text drop-shadow-[0_0_50px_rgba(var(--accent-primary),0.5)] animate-pulse-slow font-offbit"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--accent-hover), var(--accent-primary), var(--accent-hover))',
              filter: 'drop-shadow(0 0 30px var(--accent-glow))'
            }}
          >
            SIAR
          </h1>
          <p className="text-lg md:text-2xl font-light tracking-[0.2em]" style={{ color: 'var(--accent-hover)' }}>
            SISTEM INFORMASI ASURANSI RAMAYANA
          </p>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Portal Karyawan untuk Manajemen Operasional Internal
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
          <Link href="/auth/login">
            <Button
              variant="neon"
              size="xl"
              className="w-full sm:w-auto min-w-[200px] transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 0 30px var(--accent-glow)'
              }}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Masuk ke SIAR
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto min-w-[200px] transition-all duration-300 hover:scale-105"
              style={{
                borderColor: 'var(--accent-border)',
                color: 'var(--accent-primary)',
              }}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Daftar Akun Baru
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-16 text-sm text-muted-foreground text-center">
          © 2026 PT Asuransi Ramayana Tbk. All rights reserved.
        </p>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
