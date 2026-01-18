/**
 * Zustand Store for User State Management
 * Manages authenticated user data and role
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'IT' | 'NON_IT';
    divisi: string;
    cabang: string;
    nomor_id: string;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    isIT: () => boolean;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,

            setUser: (user) => set({ user, isLoading: false }),

            setLoading: (isLoading) => set({ isLoading }),

            isIT: () => get().user?.role === 'IT',

            clearUser: () => set({ user: null, isLoading: false }),
        }),
        {
            name: 'siar-user-store',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
