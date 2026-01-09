import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";
import { IOrganizer } from "@/database/organizer.model";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export interface OrganizerData {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const useGetAllOrganizers = () => {
    const { token } = useAuthStore();
    const router = useRouter();

    return useQuery<{ message: string; data: OrganizerData[] }>({
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

export interface CreateOrganizerData {
    name: string;
    fullName: string;
    email: string;
    password: string;
    description?: string;
    logo?: string;
    website?: string;
}

export interface CreateOrganizerResponse {
    message: string;
    id: string;
    name: string;
    email?: string;
    description?: string;
    logo?: string;
    website?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const useCreateOrganizer = () => {
    const { token } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation<CreateOrganizerResponse, Error, CreateOrganizerData>({
        mutationFn: async (organizerData: CreateOrganizerData) => {
            if (!token) {
                router.push('/sign-in');
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${BASE_URL}/api/admin/organizers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(organizerData),
            });

            if (response.status === 401) {
                // Token invalid, clear auth
                useAuthStore.getState().clearAuth();
                router.push('/sign-in');
                throw new Error('Unauthorized');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create organizer');
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch organizers list
            queryClient.invalidateQueries({ queryKey: ['admin', 'organizers'] });
        },
    });
};

