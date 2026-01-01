import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';

interface SignInCredentials {
    email: string;
    password: string;
    role: 'admin' | 'user';
}

interface SignUpCredentials {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'user';
    };
    message?: string;
}

// Verify token
export const useVerifyAuth = () => {
    const { token, clearAuth } = useAuthStore();

    return useQuery({
        queryKey: ['auth', 'verify'],
        queryFn: async () => {
            if (!token) {
                throw new Error('No token');
            }

            const response = await fetch('/api/auth/sign-in', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                clearAuth();
                throw new Error('Invalid token');
            }

            return response.json();
        },
        enabled: !!token,
        retry: false,
    });
};

// Sign in mutation
export const useSignIn = () => {
    const { setAuth } = useAuthStore();

    return useMutation({
        mutationFn: async (credentials: SignInCredentials): Promise<AuthResponse> => {
            const response = await fetch('/api/auth/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Sign in failed');
            }

            return data;
        },
        onSuccess: (data) => {
            if (data.token && data.user) {
                setAuth(data.token, data.user);
            }
        },
    });
};

// Sign up mutation
export const useSignUp = () => {
    const { setAuth } = useAuthStore();

    return useMutation({
        mutationFn: async (credentials: SignUpCredentials): Promise<AuthResponse> => {
            const response = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Sign up failed');
            }

            return data;
        },
        onSuccess: (data) => {
            if (data.token && data.user) {
                setAuth(data.token, data.user);
            }
        },
    });
};

