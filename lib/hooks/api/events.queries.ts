import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IEvent } from '@/database/event.model';

interface EventsResponse {
    events: IEvent[];
}

interface EventResponse {
    event: IEvent;
}

interface CreateEventResponse {
    message: string;
    event: IEvent;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Fetch all events
export const useEvents = () => {
    return useQuery<EventsResponse>({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await fetch(`${BASE_URL}/api/events`);

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            return response.json();
        },
    });
};

// Fetch event by slug
export const useEventBySlug = (slug: string) => {
    return useQuery<EventResponse>({
        queryKey: ['events', slug],
        queryFn: async () => {
            const response = await fetch(`${BASE_URL}/api/events/${slug}`);

            if (!response.ok) {
                throw new Error('Failed to fetch event');
            }

            const data = await response.json();
            console.log("🟢 CLIENT: API Response:", data);
            console.log("🟢 CLIENT: Organizer name:", data?.data?.event?.organizer);
            return data;
        },
        enabled: !!slug,
    });
};

// Create event
export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateEventResponse, Error, FormData>({
        mutationFn: async (formData: FormData) => {
            const response = await fetch(`${BASE_URL}/api/events`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event');
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch events list
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
};

