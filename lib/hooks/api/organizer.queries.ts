import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";

export interface OrganizerStats {
    totalEvents: number;
    upcomingEvents: number;
    totalBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    recentEvents: Array<{
        id: string;
        title: string;
        date: string;
        bookings: number;
        status: string;
    }>;
}

export interface OrganizerStatsResponse {
    message: string;
    // handleSuccessResponse spreads the data object, so stats are at root level
    totalEvents: number;
    upcomingEvents: number;
    totalBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    recentEvents: Array<{
        id: string;
        title: string;
        date: string;
        bookings: number;
        status: string;
    }>;
    // Also support nested structure for backward compatibility
    data?: OrganizerStats;
}

export interface OrganizerEvent {
    id: string;
    title: string;
    slug: string;
    description: string;
    image: string;
    date: string;
    time: string;
    location: string;
    mode: string;
    status: string;
    capacity?: number;
    availableTickets?: number;
    confirmedBookings?: number;
    isFree: boolean;
    price?: number;
    paymentMethods?: string[];
    paymentDetails?: {
        bank?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
        };
        gcash?: {
            name: string;
            number: string;
        };
        grabpay?: {
            name: string;
            number: string;
        };
        paymaya?: {
            name: string;
            number: string;
        };
        qr?: {
            qrCodeUrl: string;
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface OrganizerEventsResponse {
    message: string;
    events: OrganizerEvent[];
    // Also support nested structure for backward compatibility
    data?: {
        events: OrganizerEvent[];
    };
}

export const useOrganizerStats = () => {
    const { token } = useAuthStore();

    return useQuery<OrganizerStatsResponse>({
        queryKey: ["organizer", "stats"],
        queryFn: async () => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/organizer/stats", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch organizer stats");
            }

            return response.json();
        },
        enabled: !!token,
    });
};

export const useOrganizerEvents = () => {
    const { token } = useAuthStore();

    return useQuery<OrganizerEventsResponse>({
        queryKey: ["organizer", "events"],
        queryFn: async () => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/organizer/events", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch events");
            }

            return response.json();
        },
        enabled: !!token,
    });
};

export const useCreateOrganizerEvent = () => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/organizer/events", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create event");
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizer", "events"] });
            queryClient.invalidateQueries({ queryKey: ["organizer", "stats"] });
        },
    });
};

export interface Attendee {
    id: string;
    name?: string;
    email: string;
    ticketNumber?: string;
    ticketStatus?: string;
    bookedAt: string;
    paymentStatus?: 'pending' | 'confirmed' | 'rejected';
    receiptUrl?: string;
    paymentMethod?: string;
}

export interface OrganizerAttendeesResponse {
    success: boolean;
    message: string;
    data: {
        attendees: Attendee[];
    };
}

export const useOrganizerAttendees = (eventId?: string) => {
    const { token } = useAuthStore();

    return useQuery<OrganizerAttendeesResponse>({
        queryKey: ["organizer", "attendees", eventId],
        queryFn: async () => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            const url = eventId && eventId.trim() !== ''
                ? `/api/organizer/attendees?eventId=${eventId}`
                : "/api/organizer/attendees";

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch attendees");
            }

            return response.json();
        },
        enabled: !!token,
    });
};

export interface Organizer {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizerResponse {
    message: string;
    organizer: Organizer;
    // Also support nested structure for backward compatibility
    data?: {
        organizer: Organizer;
    };
}

export const useOrganizer = (organizerId: string | undefined) => {
    const { token } = useAuthStore();

    return useQuery<OrganizerResponse>({
        queryKey: ["organizer", organizerId],
        queryFn: async () => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            if (!organizerId) {
                throw new Error("Organizer ID is required");
            }

            const response = await fetch(`/api/admin/organizers/${organizerId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch organizer");
            }

            return response.json();
        },
        enabled: !!token && !!organizerId,
    });
};

// Hook to fetch current organizer's data (for logged-in organizer)
export const useCurrentOrganizer = () => {
    const { token } = useAuthStore();

    return useQuery<OrganizerResponse>({
        queryKey: ["organizer", "current"],
        queryFn: async () => {
            if (!token) {
                throw new Error("Not authenticated");
            }

            // First, get user profile to get organizerId
            const profileResponse = await fetch("/api/users/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                throw new Error("Failed to fetch user profile");
            }

            const profileData = await profileResponse.json();
            const organizerId = profileData?.data?.user?.organizerId || profileData?.user?.organizerId;

            if (!organizerId) {
                throw new Error("User is not associated with an organizer");
            }

            // Then fetch organizer data
            const response = await fetch(`/api/admin/organizers/${organizerId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch organizer");
            }

            return response.json();
        },
        enabled: !!token,
    });
};