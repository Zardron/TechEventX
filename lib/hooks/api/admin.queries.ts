import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export interface DashboardStatistics {
    totals: {
        users: number;
        events: number;
        bookings: number;
        organizers: number;
    };
    roleDistribution: {
        admin?: number;
        user?: number;
        organizer?: number;
    };
    modeDistribution: {
        Virtual?: number;
        Onsite?: number;
        Hybrid?: number;
    };
    eventsOverTime: Array<{
        month: string;
        count: number;
    }>;
    bookingsOverTime: Array<{
        month: string;
        count: number;
    }>;
    usersOverTime: Array<{
        month: string;
        count: number;
    }>;
}

export interface StatisticsResponse {
    message: string;
    totals: DashboardStatistics['totals'];
    roleDistribution: DashboardStatistics['roleDistribution'];
    modeDistribution: DashboardStatistics['modeDistribution'];
    eventsOverTime: DashboardStatistics['eventsOverTime'];
    bookingsOverTime: DashboardStatistics['bookingsOverTime'];
    usersOverTime: DashboardStatistics['usersOverTime'];
}

export const useDashboardStatistics = (timeRange: string = "6months") => {
    const { token } = useAuthStore();
    const router = useRouter();

    return useQuery<StatisticsResponse>({
        queryKey: ['admin', 'statistics', timeRange],
        queryFn: async () => {
            if (!token) {
                router.push('/sign-in');
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${BASE_URL}/api/admin/statistics?timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                useAuthStore.getState().clearAuth();
                router.push('/sign-in');
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            return data;
        },
        enabled: !!token,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

