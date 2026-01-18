'use client';

/**
 * SIAR Sidebar Navigation
 * Role-based menu with accent colors and shared collapsed state
 * Enhanced with Framer Motion for smooth animations
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/sidebar-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Wrench,
    FolderKanban,
    Calendar,
    FileText,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    User,
    Menu,
} from 'lucide-react';

const menuItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        itOnly: false,
    },
    {
        title: 'Maintenance',
        href: '/dashboard/maintenance',
        icon: Wrench,
        itOnly: false,
    },
    {
        title: 'Projects',
        href: '/dashboard/projects',
        icon: FolderKanban,
        itOnly: false,
    },
    {
        title: 'Calendar',
        href: '/dashboard/calendar',
        icon: Calendar,
        itOnly: false,
    },
    {
        title: 'Chat',
        href: '/dashboard/chat',
        icon: MessageSquare,
        itOnly: false,
    },
    {
        title: 'Activity Logs',
        href: '/dashboard/logs',
        icon: FileText,
        itOnly: true,
    },
    {
        title: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        itOnly: false,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { isCollapsed, toggleCollapsed } = useSidebar();
    const [mounted, setMounted] = useState(false);

    const isIT = session?.user?.role === 'IT';

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredItems = menuItems.filter((item) => !item.itOnly || isIT);

    if (!mounted) return null;

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isCollapsed ? 64 : 256,
                    transition: { duration: 0.3, ease: 'anticipate' }
                }}
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-background/80 backdrop-blur-xl border-r hidden md:flex flex-col'
                )}
                style={{ borderColor: 'var(--accent-border)' }}
            >
                {/* Logo */}
                <div
                    className={cn(
                        "h-20 flex items-center justify-center border-b transition-all duration-300",
                        isCollapsed ? "px-0" : "px-4"
                    )}
                    style={{ borderColor: 'var(--accent-border)' }}
                >
                    <button
                        onClick={toggleCollapsed}
                        className={cn(
                            "flex items-center justify-center transition-all duration-300 group focus:outline-none",
                            isCollapsed ? "w-10 h-10 rounded-xl hover:bg-white/10" : "gap-3 px-3 py-2 rounded-lg hover:bg-white/5 w-full"
                        )}
                    >
                        {isCollapsed ? (
                            <Menu className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                            <>
                                <Menu className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                                <span className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors">Collapse</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={cn(
                    "flex-1 space-y-2 overflow-y-auto overflow-x-hidden transition-all duration-300",
                    isCollapsed ? "p-2" : "p-4"
                )}>
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors relative group overflow-hidden',
                                        isActive
                                            ? 'text-white'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                    )}
                                    style={isActive ? {
                                        background: 'var(--accent-bg)',
                                        border: '1px solid var(--accent-border)',
                                        color: 'var(--accent-primary)'
                                    } : {}}
                                >


                                    <Icon className={cn(
                                        'w-5 h-5 flex-shrink-0',
                                        isActive && 'accent-text'
                                    )} />

                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="whitespace-nowrap"
                                            >
                                                {item.title}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>


            </motion.aside>

            {/* Mobile Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/80 backdrop-blur-xl border-t safe-area-bottom"
                style={{ borderColor: 'var(--accent-border)' }}
            >
                <div className="flex justify-around items-center h-16 px-2">
                    {filteredItems.slice(0, 5).map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all',
                                    isActive
                                        ? 'accent-text'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                                <span className="text-[10px] font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <style jsx global>{`
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
        </>
    );
}
