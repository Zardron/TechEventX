import { useQuery } from '@tanstack/react-query';
import { IEvent } from '@/database/event.model';

interface EventsResponse {
    events: IEvent[];
}

interface EventResponse {
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

            return response.json();
        },
        enabled: !!slug,
    });
};

