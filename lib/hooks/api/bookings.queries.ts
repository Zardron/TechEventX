import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

interface Booking {
    id: string;
    eventId: string;
    event: {
        id: string;
        title: string;
        slug: string;
        date: string;
        time: string;
        venue: string;
        location: string;
        image: string;
        mode: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface BookingsResponse {
    bookings: Booking[];
}

// Fetch all bookings
export const useBookings = () => {
    const { token } = useAuthStore();
    const router = useRouter();

    return useQuery({
        queryKey: ['bookings'],
        queryFn: async (): Promise<BookingsResponse> => {
            if (!token) {
                router.push('/sign-in');
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/bookings', {
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
                throw new Error('Failed to fetch bookings');
            }

            return response.json();
        },
        enabled: !!token,
    });
};

// Create a booking
export const useCreateBooking = () => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (eventSlug: string) => {
            if (!token) {
                router.push('/sign-in');
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ eventSlug }),
            });

            const data = await response.json();

            if (response.status === 401) {
                useAuthStore.getState().clearAuth();
                router.push('/sign-in');
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create booking');
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate bookings query to refetch
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
};

// Check if user has booked an event
export const useHasBookedEvent = (eventSlug: string) => {
    const { token } = useAuthStore();
    const { data: bookingsData, isLoading } = useBookings();

    if (!eventSlug || !token) {
        return { hasBooked: false, isLoading: false };
    }

    if (isLoading || !bookingsData?.bookings) {
        return { hasBooked: false, isLoading: true };
    }

    const hasBooked = bookingsData.bookings.some(
        (booking) => booking.event?.slug === eventSlug
    );

    return {
        hasBooked,
        isLoading: false,
    };
};

