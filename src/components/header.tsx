'use client';

/**
 * SIAR Dashboard Header
 * Top navigation with notifications, theme toggle, and logout
 */

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Notifications } from '@/components/notifications';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, LogOut, User, Building2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (session?.user) {
            setDisplayName(session.user.name || '');

            // Initial load of profile image
            const loadProfileData = () => {
                const userId = session.user.id; // Correctly typed from auth.ts
                const savedImage = localStorage.getItem(`siar-profile-${userId}`);
                if (savedImage) setProfileImage(savedImage);

                // Also try to fetch latest name if needed, but session name is usually enough until refresh
                // For direct name updates without reload, we might need to fetch /api/profile
                fetch('/api/profile').then(res => {
                    if (res.ok) return res.json();
                    return null;
                }).then(data => {
                    if (data?.nama_lengkap) setDisplayName(data.nama_lengkap);
                    if (data?.profile_picture) {
                        setProfileImage(data.profile_picture);
                        localStorage.setItem(`siar-profile-${session.user.id}`, data.profile_picture);
                    }
                }).catch(() => { });
            };

            loadProfileData();

            // Listen for updates
            const handleUpdate = () => loadProfileData();
            window.addEventListener('profile-update', handleUpdate);
            return () => window.removeEventListener('profile-update', handleUpdate);
        }
    }, [session]);

    const handleLogout = async () => {
        toast({
            title: 'Logout',
            description: 'Anda telah keluar dari sistem.',
        });
        await signOut({ callbackUrl: '/' });
    };

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header
            className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b"
            style={{ borderColor: 'var(--accent-border)' }}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Left side - Page title placeholder */}
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">
                        <span className="font-offbit" style={{ color: 'var(--accent-primary)' }}>SIAR</span>
                    </h2>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    {/* Chat Link */}
                    <Link href="/dashboard/chat">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* Notifications */}
                    <Notifications />

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* User Menu */}
                    {session?.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-10 w-10 rounded-full ring-2 ring-cyan-500/30 hover:ring-cyan-500/50 transition-all duration-200 hover:scale-105"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={profileImage || undefined} alt={displayName} />
                                        <AvatarFallback
                                            className="text-white font-medium"
                                            style={{ background: 'var(--accent-primary)' }}
                                        >
                                            {getInitials(displayName || 'U')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 backdrop-blur-xl bg-background/60 border-white/10 shadow-2xl" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-2">
                                        <p className="text-sm font-medium leading-none">
                                            {displayName}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {session.user.email}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${session.user.role === 'IT'
                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                                    }`}
                                            >
                                                {session.user.role === 'IT' ? 'IT Admin' : 'Staff'}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2">
                                    <User className="w-4 h-4" />
                                    <span>ID: {session.user.nomor_id}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <Building2 className="w-4 h-4" />
                                    <span>{session.user.divisi}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="gap-2 text-red-500 focus:text-red-500"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Keluar</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
