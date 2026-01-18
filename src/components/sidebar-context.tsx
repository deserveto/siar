'use client';

/**
 * Sidebar Context - manages collapsed state across components
 */

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('siar-sidebar-collapsed');
        if (saved) {
            setIsCollapsed(saved === 'true');
        }
        setMounted(true);
    }, []);

    const toggleCollapsed = () => {
        const newValue = !isCollapsed;
        setIsCollapsed(newValue);
        localStorage.setItem('siar-sidebar-collapsed', String(newValue));
    };

    const handleSetCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        localStorage.setItem('siar-sidebar-collapsed', String(collapsed));
    };



    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed: handleSetCollapsed, toggleCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
