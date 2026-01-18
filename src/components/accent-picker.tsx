"use client";

import * as React from "react";
import { Palette, Check, Paintbrush } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAccent, accentColors } from "@/components/accent-provider";

export function AccentPicker() {
    const [mounted, setMounted] = React.useState(false);
    const { accent, setAccent } = useAccent();
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-9 h-9 bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300 group"
                >
                    <Paintbrush className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="sr-only">Change Color</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-64 p-3 backdrop-blur-xl bg-background/90 border-primary/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    <Palette className="w-3 h-3" />
                    Accent Color
                </DropdownMenuLabel>

                <div className="grid grid-cols-3 gap-3">
                    {accentColors.map((color) => (
                        <motion.button
                            key={color.name}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title={color.name}
                            className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${accent === color.value
                                    ? "ring-2 ring-offset-2 ring-offset-background"
                                    : "opacity-80 hover:opacity-100"
                                }`}
                            style={{
                                backgroundColor: color.primary,
                                boxShadow: accent === color.value ? `0 0 10px ${color.primary}` : 'none',
                                borderColor: `${color.primary}`
                            }}
                            onClick={() => setAccent(color.value)}
                        >
                            <AnimatePresence>
                                {accent === color.value && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                    >
                                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
