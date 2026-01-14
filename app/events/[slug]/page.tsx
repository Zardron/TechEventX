"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import { IEvent } from "@/database/event.model";
import EventCard from "@/components/EventCard";
import { formatDateToReadable } from "@/lib/utils";
import { formatDateTo12Hour } from "@/lib/formatters";
import { useEventBySlug, useEvents } from "@/lib/hooks/api/events.queries";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";

const InfoBadge = ({ icon, label, value }: { icon: string, label: string, value: string }) => {
    return (
        <div className="flex items-center gap-3 p-4 rounded-md bg-dark-200/30 border border-border-dark/30 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
            <div className="shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Image src={icon} alt={label} width={20} height={20} className="opacity-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-light-200 uppercase tracking-wider">{label}</span>
                <span className="text-sm font-semibold text-light-100 mt-0.5 capitalize">{value}</span>
            </div>
        </div>
    )
}

const AgendaItem = ({ item, index, total }: { item: string, index: number, total: number }) => {
    return (
        <div className="relative flex gap-4 group">
            {/* Timeline */}
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors duration-200">
                    <span className="text-primary text-sm font-bold">{index + 1}</span>
                </div>
                {index < total - 1 && (
                    <div className="w-0.5 h-full bg-linear-to-b from-primary/30 to-transparent mt-2 min-h-[40px]" />
                )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-8 group-hover:translate-x-1 transition-transform duration-200">
                <p className="mt-2 text-light-100 text-base leading-relaxed">{item}</p>
            </div>
        </div>
    )
}

const EventDetailsPage = ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = use(params);
    const { data: eventData, isLoading, error } = useEventBySlug(slug);
    const { data: allEventsData } = useEvents();
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [isFavorited, setIsFavorited] = useState(false);

    // Check if event is favorited
    const { data: favoritesData } = useQuery({
        queryKey: ["user", "favorites"],
        queryFn: async () => {
            if (!token) return null;
            const response = await fetch("/api/users/favorites", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!token && !!eventData?.event,
    });

    // Update favorite status
    useEffect(() => {
        if (favoritesData?.data?.favorites && eventData?.event) {
            const favorited = favoritesData.data.favorites.some(
                (f: any) => f.id === eventData.event.id
            );
            setIsFavorited(favorited);
        }
    }, [favoritesData, eventData]);

    // Toggle favorite mutation
    const toggleFavoriteMutation = useMutation({
        mutationFn: async (eventId: string) => {
            if (!token) throw new Error("Not authenticated");
            if (isFavorited) {
                const response = await fetch(`/api/users/favorites?eventId=${eventId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || "Failed to remove favorite");
                }
            } else {
                const response = await fetch("/api/users/favorites", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ eventId }),
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || "Failed to add favorite");
                }
            }
            return response.json();
        },
        onSuccess: () => {
            setIsFavorited(!isFavorited);
            queryClient.invalidateQueries({ queryKey: ["user", "favorites"] });
            toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update favorite");
        },
    });

    const handleShare = () => {
        if (!event) return;
        const url = `${window.location.origin}/events/${slug}`;
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description,
                url: url,
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
        }
    };

    if (isLoading) {
        return (
            <div className="w-full mt-14 -mx-10 max-sm:-mx-5 min-h-screen flex items-center justify-center">
                <div className="text-light-200">Loading event...</div>
            </div>
        );
    }

    if (error || !eventData?.event) {
        return (
            <div className="w-full mt-14 -mx-10 max-sm:-mx-5 min-h-screen flex items-center justify-center">
                <div className="text-light-200">Event not found</div>
            </div>
        );
    }

    const { event } = eventData;
    console.log("🟢 PAGE: Event data:", event);
    console.log("🟢 PAGE: Organizer field:", event?.organizer);
    const { title, description, overview, image, venue, location, date, time, mode, audience, agenda, organizer, tags, isFree, price, currency } = event;
    
    // Extract organizer name (handle cases where organizer field contains descriptions)
    const getOrganizerName = (organizerText: string): string => {
        // If it's a short string (likely just a name), return as is
        if (organizerText.length < 50) {
            return organizerText;
        }
        // Extract name before common verbs like "organizes", "presents", "hosts", etc.
        const match = organizerText.match(/^([^,\.]+?)\s+(?:organizes|presents|hosts|runs|creates|launches)/i);
        if (match) {
            return match[1].trim();
        }
        // If no pattern matches, return first 30 characters
        return organizerText.substring(0, 30).trim();
    };
    
    const organizerName = getOrganizerName(organizer);

    const bookings: number = 10;

    // Find similar events based on tags (client-side filtering)
    const similarEvents: IEvent[] = allEventsData?.events
        ? allEventsData.events
            .filter((e: IEvent) => e.slug !== slug && e.tags?.some(tag => tags?.includes(tag)))
            .slice(0, 6) // Limit to 6 similar events
        : [];

    return (
        <div className="w-full mt-14 -mx-10 max-sm:-mx-5">
            {/* Hero Section - Redesigned with Contained Image */}
            <div className="px-5 sm:px-10 mb-12 md:mb-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Content */}
                        <div className="space-y-6 order-2 lg:order-1">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {tags.slice(0, 3).map((tag: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gradient">
                                {title}
                            </h1>

                            {/* Description */}
                            <p className="text-lg md:text-xl text-light-100 leading-relaxed max-w-2xl">
                                {description}
                            </p>

                            {/* Location & Price Badges */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 px-5 py-3 rounded-md bg-dark-200/50 border border-border-dark/50 w-fit">
                                    <Image src="/icons/pin.svg" alt="Location" width={18} height={18} className="opacity-90" />
                                    <span className="text-light-100 font-medium">{location}</span>
                                </div>
                                {/* Price Badge */}
                                <div className={`flex items-center gap-2 px-5 py-3 rounded-md border w-fit ${
                                    isFree 
                                        ? "bg-green-500/10 border-green-500/30" 
                                        : "bg-primary/10 border-primary/30"
                                }`}>
                                    <span className={`text-sm font-bold ${
                                        isFree ? "text-green-400" : "text-primary"
                                    }`}>
                                        {isFree ? "FREE" : `₱${((price || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Image */}
                        <div className="relative order-1 lg:order-2">
                            <div className="relative aspect-4/3 rounded-md overflow-hidden border border-border-dark/50 shadow-2xl">
                                <Image
                                    src={image}
                                    alt={title}
                                    width={800}
                                    height={600}
                                    className="object-cover w-full h-full"
                                    priority
                                    quality={95}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-5 sm:px-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Quick Info Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                <InfoBadge
                                    icon="/icons/calendar.svg"
                                    label="Date"
                                    value={formatDateToReadable(date)}
                                />
                                <InfoBadge
                                    icon="/icons/clock.svg"
                                    label="Time"
                                    value={formatDateTo12Hour(time)}
                                />
                                <InfoBadge
                                    icon="/icons/mode.svg"
                                    label="Mode"
                                    value={mode}
                                />
                                <InfoBadge
                                    icon="/icons/audience.svg"
                                    label="Price"
                                    value={isFree ? "Free" : `₱${((price || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                />
                            </div>

                            {/* Overview Section */}
                            <section className="glass rounded-md p-6 md:p-8 border border-border-dark/50">
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
                                    <h2 className="text-2xl md:text-3xl font-bold">Overview</h2>
                                </div>
                                <p className="text-light-200 text-base leading-relaxed">
                                    {overview}
                                </p>
                            </section>

                            {/* Event Details */}
                            <section className="glass rounded-md p-6 md:p-8 border border-border-dark/50">
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
                                    <h2 className="text-2xl md:text-3xl font-bold">Event Details</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/calendar.svg" alt="Date" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Date</p>
                                            <p className="text-base font-semibold text-light-100">{formatDateToReadable(date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/clock.svg" alt="Time" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Time</p>
                                            <p className="text-base font-semibold text-light-100">{formatDateTo12Hour(time)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/pin.svg" alt="Venue" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Venue</p>
                                            <p className="text-base font-semibold text-light-100">{venue}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/mode.svg" alt="Mode" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Mode</p>
                                            <p className="text-base font-semibold text-light-100">{mode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/audience.svg" alt="Audience" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Audience</p>
                                            <p className="text-base font-semibold text-light-100">{audience}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/audience.svg" alt="Organizer" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Organizer</p>
                                            <p className="text-base font-semibold text-light-100">{organizerName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200">
                                        <Image src="/icons/audience.svg" alt="Price" width={20} height={20} className="mt-1 opacity-80" />
                                        <div>
                                            <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Price</p>
                                            <p className={`text-base font-semibold ${
                                                isFree ? "text-green-400" : "text-primary"
                                            }`}>
                                                {isFree ? "Free" : `₱${((price || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Agenda Section */}
                            <section className="glass rounded-md p-6 md:p-8 border border-border-dark/50">
                                <div className="flex items-center gap-3 mb-6 md:mb-8">
                                    <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
                                    <h2 className="text-2xl md:text-3xl font-bold">Agenda</h2>
                                </div>
                                <div className="space-y-0">
                                    {agenda.map((item: string, index: number) => (
                                        <AgendaItem
                                            key={index}
                                            item={item}
                                            index={index}
                                            total={agenda.length}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Organizer Section */}
                            <section className="glass rounded-md p-6 md:p-8 border border-border-dark/50">
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
                                    <h2 className="text-2xl md:text-3xl font-bold">About the Organizer</h2>
                                </div>
                                <p className="text-light-200 text-base leading-relaxed">
                                    {organizer}
                                </p>
                            </section>

                            {/* All Tags */}
                            <section className="glass rounded-md p-6 md:p-8 border border-border-dark/50">
                                <h3 className="text-lg md:text-xl font-semibold mb-4 text-light-100">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 transition-colors duration-200"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-20 lg:top-24">
                                <div className="glass rounded-md p-6 md:p-8 border border-primary/30 card-shadow" style={{ boxShadow: '0 0 10px rgba(89, 222, 202, 0.1), 0 0 20px rgba(89, 222, 202, 0.05)' }}>
                                    <div className="mb-6">
                                        <h2 className="text-xl md:text-2xl font-bold mb-3">Book Your Spot</h2>
                                        {bookings > 0 ? (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    {/* Stacked numbers - first 3 */}
                                                    <div className="flex -space-x-2">
                                                        {[...Array(Math.min(3, bookings))].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-9 h-9 rounded-full bg-primary/20 border-2 border-dark-100 flex items-center justify-center text-xs font-bold text-primary backdrop-blur-sm relative z-10 hover:z-20 transition-all duration-200 hover:scale-110"
                                                                style={{ zIndex: 10 - i }}
                                                            >
                                                                {i + 1}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Ellipsis if more than 3 bookings */}
                                                    {bookings > 3 && (
                                                        <span className="text-light-200 text-sm font-medium px-2 -ml-2">...</span>
                                                    )}

                                                    {/* Last number (only if more than 3 bookings) */}
                                                    {bookings > 3 && (
                                                        <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-dark-100 flex items-center justify-center text-xs font-bold text-primary backdrop-blur-sm -ml-2 relative z-0">
                                                            {bookings}
                                                        </div>
                                                    )}

                                                    {/* Booking text on the right */}
                                                    <div className="flex flex-col ml-auto">
                                                        <span className="text-sm font-semibold text-light-100 whitespace-nowrap">
                                                            {bookings} {bookings === 1 ? 'person' : 'people'} booked
                                                        </span>
                                                        <span className="text-xs text-light-200 whitespace-nowrap">Join them now!</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-light-200 mb-4">Be the first to book your spot.</p>
                                        )}
                                    </div>
                                    <BookEvent eventSlug={slug} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Similar Events Section */}
            {similarEvents.length > 0 && (
                <div className="px-5 sm:px-10 mt-12 md:mt-20 pt-12 md:pt-16 border-t border-border-dark/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="w-1 h-8 md:h-10 bg-primary rounded-full" />
                            <h2 className="text-2xl md:text-4xl font-bold">Similar Events</h2>
                        </div>
                        <div className="events">
                            {similarEvents.map((similarEvent: IEvent) => (
                                <EventCard key={similarEvent.slug} {...similarEvent} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EventDetailsPage
