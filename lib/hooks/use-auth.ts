import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Hook to initialize auth state from localStorage on mount
 */
export const useAuth = () => {
    const { initializeAuth, token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return {
        token,
        user,
        isAuthenticated,
        setAuth,
        clearAuth,
    };
};

