"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizerEvents } from "@/lib/hooks/api/organizer.queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Users, DollarSign, Copy, Download, PhilippinePesoIcon } from "lucide-react";
import { formatDateToReadable } from "@/lib/formatters";
import toast from "react-hot-toast";

export default function OrganizerEventsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useOrganizerEvents();
    // handleSuccessResponse spreads the data object, so events is at the root level
    const events = data?.events || data?.data?.events || [];

    console.log("Events:", events);

    // Duplicate event mutation
    const duplicateMutation = useMutation({
        mutationFn: async (eventId: string) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/organizer/events/${eventId}/duplicate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to duplicate event");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Event duplicated successfully");
            queryClient.invalidateQueries({ queryKey: ["organizer", "events"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to duplicate event");
        },
    });

    // Export events
    const handleExport = async () => {
        try {
            if (!token) {
                toast.error("Not authenticated");
                return;
            }

            const response = await fetch("/api/organizer/events/export", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Failed to export events");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `events-${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success("Events exported successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to export events");
        }
    };

    const handleDelete = async (eventId: string, eventTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/organizer/events/${eventId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete event");
            }

            toast.success("Event deleted successfully");
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete event");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
                        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
                    </div>
                </div>

                {/* Event Cards Skeleton */}
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded w-64"></div>
                                        <div className="h-6 bg-muted rounded w-20"></div>
                                    </div>
                                    <div className="h-4 bg-muted rounded w-full"></div>
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[...Array(4)].map((_, j) => (
                                            <div key={j} className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-muted rounded"></div>
                                                <div className="h-4 bg-muted rounded w-24"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="w-9 h-9 bg-muted rounded"></div>
                                    ))}
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Events</h1>
                    <p className="text-muted-foreground mt-2">Failed to load events</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Events</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage all your events ({events.length} total)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/organizer-dashboard/events/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Event
                        </Button>
                    </Link>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                    <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
                    <Link href="/organizer-dashboard/events/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Event
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="p-6 border rounded-md hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-xl font-semibold">{event.title}</h3>
                                        <div className="flex items-center gap-1">
                                        <span
                                            className={`px-2 py-1 rounded-sm uppercase text-[10px] font-medium ${
                                                event.status === "published"
                                                    ? "bg-green-500/10 text-green-500"
                                                    : event.status === "draft"
                                                    ? "bg-gray-500/10 text-gray-500"
                                                    : "bg-red-500/10 text-red-500"
                                            }`}
                                        >
                                            {event.status}
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded-sm uppercase text-[10px] font-medium ${
                                                event.isFree
                                                    ? "bg-blue-500/10 text-blue-500"
                                                    : "bg-purple-500/10 text-purple-500"
                                            }`}
                                        >
                                            {event.isFree ? "Free" : "Paid"}
                                        </span>
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground mb-4 line-clamp-2">
                                        {event.description}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{formatDateToReadable(event.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span>
                                                {event.capacity
                                                    ? `${event.confirmedBookings || 0}/${event.capacity}`
                                                    : "Unlimited"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PhilippinePesoIcon className="w-4 h-4 text-muted-foreground" />
                                            <span>{event.isFree ? "Free" : `₱${((event.price || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <Link href={`/events/${event.slug}`}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/organizer-dashboard/events/${event.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => duplicateMutation.mutate(event.id)}
                                        disabled={duplicateMutation.isPending}
                                        title="Duplicate Event"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(event.id, event.title)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


