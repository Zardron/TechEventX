"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, Calendar, MapPin, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import Image from "next/image";
import Link from "next/link";

export default function FavoritesPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch favorites
    const { data, isLoading, error } = useQuery({
        queryKey: ["user", "favorites"],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/users/favorites", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch favorites");
            return response.json();
        },
        enabled: !!token,
    });

    const favorites = data?.data?.favorites || [];

    // Remove favorite mutation
    const removeFavoriteMutation = useMutation({
        mutationFn: async (eventId: string) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/users/favorites?eventId=${eventId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to remove favorite");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Removed from favorites");
            queryClient.invalidateQueries({ queryKey: ["user", "favorites"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to remove favorite");
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-foreground/60">Loading favorites...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">Error loading favorites</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Favorites</h1>
                <p className="text-muted-foreground mt-2">
                    Events you've saved for later ({favorites.length} total)
                </p>
            </div>

            {favorites.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-card">
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground mb-4">No favorite events yet</p>
                    <Link href="/events">
                        <Button>Browse Events</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((event: any) => (
                        <div
                            key={event.id}
                            className="border rounded-lg bg-card overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <Link href={`/events/${event.slug}`}>
                                <div className="relative w-full h-48">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </Link>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <Link href={`/events/${event.slug}`}>
                                        <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFavoriteMutation.mutate(event.id)}
                                        disabled={removeFavoriteMutation.isPending}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {event.description}
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatDateToReadable(event.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatDateTo12Hour(event.time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>
                                <Link href={`/events/${event.slug}`} className="mt-4 block">
                                    <Button className="w-full mt-4">View Event</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

