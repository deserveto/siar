'use client';

/**
 * SIAR Dashboard Layout
 * Wraps all dashboard pages with Sidebar and Header
 * Uses SidebarContext for responsive layout
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { SidebarProvider, useSidebar } from '@/components/sidebar-context';
import { Loader2 } from 'lucide-react';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-background relative">
            {/* Blurred gradient background using accent colors */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-1/2 -left-1/2 w-full h-full blur-3xl opacity-20"
                    style={{ background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)` }}
                />
                <div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full blur-3xl opacity-20"
                    style={{ background: `radial-gradient(circle, var(--accent-hover) 0%, transparent 70%)` }}
                />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area - responsive to sidebar collapsed state */}
            <div
                className="transition-all duration-300 pb-24 md:pb-0"
                style={{
                    marginLeft: 0,
                    paddingLeft: 0,
                }}
            >
                <div
                    className="hidden md:block transition-all duration-300"
                    style={{ marginLeft: isCollapsed ? '64px' : '256px' }}
                >
                    {/* Header */}
                    <Header />

                    {/* Page Content */}
                    <main className="relative z-10 p-6 pl-11">
                        {children}
                    </main>
                </div>
                {/* Mobile layout - no sidebar offset */}
                <div className="md:hidden">
                    <Header />
                    <main className="relative z-10 p-4 pb-20">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    // Show loading state while checking session
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin accent-text" />
                    <p className="text-muted-foreground">Memuat SIAR Dashboard...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
        </SidebarProvider>
    );
}
