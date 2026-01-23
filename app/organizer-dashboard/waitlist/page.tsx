"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { FormSelect } from "@/components/ui/form-select";
import { Users, Clock, Mail, CheckCircle } from "lucide-react";
import { useOrganizerEvents } from "@/lib/hooks/api/organizer.queries";
import { formatDateToReadable } from "@/lib/formatters";

export default function WaitlistPage() {
    const { token } = useAuthStore();
    const { data: eventsData } = useOrganizerEvents();
    const events = eventsData?.data?.events || [];
    const [selectedEventId, setSelectedEventId] = useState<string>("");

    // Fetch waitlist
    const { data, isLoading, error } = useQuery({
        queryKey: ["organizer", "waitlist", selectedEventId],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const url = selectedEventId 
                ? `/api/organizer/waitlist?eventId=${selectedEventId}`
                : "/api/organizer/waitlist";
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch waitlist");
            return response.json();
        },
        enabled: !!token,
    });

    const waitlist = data?.data?.waitlist || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
                </div>

                <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>

                {/* Waitlist Entry Cards Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded w-48"></div>
                                        <div className="h-6 bg-muted rounded w-24"></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[...Array(4)].map((_, j) => (
                                            <div key={j}>
                                                <div className="h-3 bg-muted rounded w-20 mb-2"></div>
                                                <div className="h-4 bg-muted rounded w-32"></div>
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
                <div className="text-red-500">Error loading waitlist</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Waitlist Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage waitlist entries for your events
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                    <FormSelect
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        options={[
                            { value: "", label: "All Events" },
                            ...events.map((event: any) => ({
                                value: event.id,
                                label: event.title,
                            })),
                        ]}
                        label="Filter by Event"
                    />
                </div>
            </div>

            {waitlist.length === 0 ? (
                <div className="p-12 text-center border rounded-md bg-card">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No waitlist entries found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {waitlist.map((entry: any) => (
                        <div
                            key={entry.id}
                            className="p-6 border rounded-md bg-card"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{entry.email}</h3>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            Position #{entry.position}
                                        </span>
                                        {entry.convertedToBooking && (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                                Converted
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                                        <div>
                                            <p className="text-muted-foreground">Event</p>
                                            <p className="font-semibold">{entry.event?.title || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Position</p>
                                            <p className="font-semibold">#{entry.position}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Joined</p>
                                            <p className="font-semibold">{formatDateToReadable(entry.createdAt)}</p>
                                        </div>
                                        {entry.notified && (
                                            <div>
                                                <p className="text-muted-foreground">Notified</p>
                                                <p className="font-semibold">{formatDateToReadable(entry.notifiedAt)}</p>
                                            </div>
                                        )}
                                        {entry.convertedToBooking && (
                                            <div>
                                                <p className="text-muted-foreground">Converted</p>
                                                <p className="font-semibold">{formatDateToReadable(entry.convertedAt)}</p>
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

