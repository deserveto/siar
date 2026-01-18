'use client';

/**
 * Combined Providers for SIAR Dashboard
 * Wraps the app with Theme, Session, and Query providers
 */

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AccentProvider } from '@/components/accent-provider';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    // Create a stable QueryClient instance
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AccentProvider>
                        {children}
                    </AccentProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
