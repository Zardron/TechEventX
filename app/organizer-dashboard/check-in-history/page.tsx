"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { FormSelect } from "@/components/ui/form-select";
import { CheckCircle, Calendar, Clock, User } from "lucide-react";
import { useOrganizerEvents } from "@/lib/hooks/api/organizer.queries";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";

export default function CheckInHistoryPage() {
    const { token } = useAuthStore();
    const { data: eventsData } = useOrganizerEvents();
    const events = eventsData?.data?.events || [];
    const [selectedEventId, setSelectedEventId] = useState<string>("");

    // Fetch check-in history
    const { data, isLoading, error } = useQuery({
        queryKey: ["organizer", "check-in-history", selectedEventId],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const url = selectedEventId 
                ? `/api/organizer/attendees/check-in-history?eventId=${selectedEventId}`
                : "/api/organizer/attendees/check-in-history";
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch check-in history");
            return response.json();
        },
        enabled: !!token,
    });

    const checkInHistory = data?.data?.checkInHistory || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
                </div>

                <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>

                {/* Check-in History Cards Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded w-48"></div>
                                        <div className="h-6 bg-muted rounded w-28"></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[...Array(5)].map((_, j) => (
                                            <div key={j}>
                                                <div className="h-3 bg-muted rounded w-28 mb-2"></div>
                                                <div className="h-4 bg-muted rounded w-40"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">Error loading check-in history</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Check-In History</h1>
                <p className="text-muted-foreground mt-2">
                    View check-in history for your events
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                    <FormSelect
                        label="Filter by Event"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        options={[
                            { value: "", label: "All Events" },
                            ...events.map((event: any) => ({
                                value: event.id,
                                label: event.title,
                            })),
                        ]}
                    />
                </div>
            </div>

            {checkInHistory.length === 0 ? (
                <div className="p-12 text-center border rounded-md bg-card">
                    <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No check-ins found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {checkInHistory.map((checkIn: any) => (
                        <div
                            key={checkIn.id}
                            className="p-6 border rounded-md bg-card"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{checkIn.attendee.name}</h3>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                            <CheckCircle className="w-3 h-3 inline mr-1" />
                                            Checked In
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                                        <div>
                                            <p className="text-muted-foreground">Event</p>
                                            <p className="font-semibold">{checkIn.event?.title || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Ticket Number</p>
                                            <p className="font-mono font-semibold">{checkIn.ticketNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Attendee Email</p>
                                            <p className="font-semibold">{checkIn.attendee.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Checked In At</p>
                                            <p className="font-semibold">{formatDateToReadable(checkIn.checkedInAt)}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(checkIn.checkedInAt).toLocaleTimeString()}</p>
                                        </div>
                                        {checkIn.checkedInBy && (
                                            <div>
                                                <p className="text-muted-foreground">Checked In By</p>
                                                <p className="font-semibold">{checkIn.checkedInBy.name}</p>
                                                <p className="text-xs text-muted-foreground">{checkIn.checkedInBy.email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

