'use client';

/**
 * Global Accent Color Provider
 * Manages accent color CSS variables across the entire application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const accentColors = [
    { name: 'Blue', value: 'blue', hue: '210', primary: 'hsl(210, 100%, 50%)', hover: 'hsl(210, 100%, 60%)' },
    { name: 'Purple', value: 'purple', hue: '270', primary: 'hsl(270, 80%, 60%)', hover: 'hsl(270, 80%, 70%)' },
    { name: 'Green', value: 'green', hue: '142', primary: 'hsl(142, 70%, 45%)', hover: 'hsl(142, 70%, 55%)' },
    { name: 'Orange', value: 'orange', hue: '25', primary: 'hsl(25, 95%, 55%)', hover: 'hsl(25, 95%, 65%)' },
    { name: 'Pink', value: 'pink', hue: '330', primary: 'hsl(330, 80%, 60%)', hover: 'hsl(330, 80%, 70%)' },
    { name: 'Cyan', value: 'cyan', hue: '185', primary: 'hsl(185, 90%, 45%)', hover: 'hsl(185, 90%, 55%)' },
    { name: 'Red', value: 'red', hue: '0', primary: 'hsl(0, 85%, 55%)', hover: 'hsl(0, 85%, 65%)' },
    { name: 'Yellow', value: 'yellow', hue: '45', primary: 'hsl(45, 95%, 50%)', hover: 'hsl(45, 95%, 60%)' },
];

interface AccentContextType {
    accent: string;
    setAccent: (accent: string) => void;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export function AccentProvider({ children }: { children: ReactNode }) {
    const [accent, setAccentState] = useState('blue');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('siar-accent-color');
        if (saved) {
            setAccentState(saved);
            applyAccent(saved);
        } else {
            applyAccent('blue');
        }
        setMounted(true);
    }, []);

    const applyAccent = (colorValue: string) => {
        const color = accentColors.find(c => c.value === colorValue);
        if (color) {
            const root = document.documentElement;
            // Set CSS variables for accent colors
            root.style.setProperty('--accent-hue', color.hue);
            root.style.setProperty('--accent-primary', color.primary);
            root.style.setProperty('--accent-hover', color.hover);
            root.style.setProperty('--accent-bg', `hsl(${color.hue}, 80%, 50%, 0.1)`);
            root.style.setProperty('--accent-bg-hover', `hsl(${color.hue}, 80%, 50%, 0.2)`);
            root.style.setProperty('--accent-border', `hsl(${color.hue}, 80%, 50%, 0.3)`);
            root.style.setProperty('--accent-glow', `hsl(${color.hue}, 100%, 50%, 0.5)`);
            root.style.setProperty('--accent-text', color.primary);
        }
    };

    const setAccent = (colorValue: string) => {
        setAccentState(colorValue);
        localStorage.setItem('siar-accent-color', colorValue);
        applyAccent(colorValue);
    };

    // Prevent hydration mismatch


    return (
        <AccentContext.Provider value={{ accent, setAccent }}>
            {children}
        </AccentContext.Provider>
    );
}

export function useAccent() {
    const context = useContext(AccentContext);
    if (!context) {
        throw new Error('useAccent must be used within an AccentProvider');
    }
    return context;
}
