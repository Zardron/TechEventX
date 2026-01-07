import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const useGetAllOrganizers = () => {
    const { token } = useAuthStore();
    const router = useRouter();

    return useQuery<{ message: string; data: string[] }>({
        queryKey: ['admin', 'organizers'],
        queryFn: async () => {
            if (!token) {
                router.push('/sign-in');
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${BASE_URL}/api/admin/organizers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                // Token invalid, clear auth
                useAuthStore.getState().clearAuth();
                router.push('/sign-in');
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error('Failed to fetch organizers');
            }

            const data = await response.json();
            return data;
        },
        enabled: !!token,
    });
};

