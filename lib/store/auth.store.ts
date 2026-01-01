import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,

    setAuth: (token: string, user: User) => {
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ token, user, isAuthenticated: true });
    },

    clearAuth: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        set({ token: null, user: null, isAuthenticated: false });
    },

    initializeAuth: () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({ token, user, isAuthenticated: true });
            } catch (error) {
                // Invalid user data, clear it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ token: null, user: null, isAuthenticated: false });
            }
        } else {
            set({ token: null, user: null, isAuthenticated: false });
        }
    },
}));

