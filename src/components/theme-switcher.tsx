"use client";

import * as React from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const ACCENT_COLORS = [
    { name: "Blue", hue: 210, color: "bg-blue-500" },
    { name: "Cyan", hue: 180, color: "bg-cyan-500" },
    { name: "Purple", hue: 270, color: "bg-purple-500" },
    { name: "Green", hue: 142, color: "bg-green-500" },
    { name: "Orange", hue: 24, color: "bg-orange-500" },
    { name: "Pink", hue: 330, color: "bg-pink-500" },
];

export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [accentHue, setAccentHue] = React.useState(210); // Default blue

    React.useEffect(() => {
        setMounted(true);
        // Recover accent from localStorage if available
        const savedHue = localStorage.getItem("siar-accent-hue");
        if (savedHue) {
            const hue = parseInt(savedHue);
            setAccentHue(hue);
            document.documentElement.style.setProperty("--accent-hue", hue.toString());
        }
    }, []);

    const changeAccent = (hue: number) => {
        setAccentHue(hue);
        document.documentElement.style.setProperty("--accent-hue", hue.toString());
        localStorage.setItem("siar-accent-hue", hue.toString());
    };

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] opacity-50" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/80 border-primary/20">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")} className="justify-between">
                    <span>Light</span>
                    {theme === "light" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="justify-between">
                    <span>Dark</span>
                    {theme === "dark" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="justify-between">
                    <span>System</span>
                    {theme === "system" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-primary/10" />

                <DropdownMenuLabel>Accent Color</DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-2 p-2">
                    {ACCENT_COLORS.map((color) => (
                        <button
                            key={color.name}
                            className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${color.color} ${accentHue === color.hue ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100 hover:scale-110"
                                }`}
                            onClick={() => changeAccent(color.hue)}
                            title={color.name}
                        >
                            {accentHue === color.hue && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                        </button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
