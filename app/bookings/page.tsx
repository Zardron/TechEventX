"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Monitor, List } from "lucide-react";
import { formatTimeWithAMPM, formatDateToReadable } from "@/lib/formatters";

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

const BookingsPage = () => {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAllBookings, setShowAllBookings] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/sign-in');
                    return;
                }

                const response = await fetch('/api/bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/sign-in');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch bookings');
                }

                const data = await response.json();
                setBookings(data.bookings || []);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [router]);

    // Calendar functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getBookingsForDate = (date: Date | null) => {
        if (!date) return [];
        const dateStr = formatDateToString(date);
        return bookings.filter(booking => booking.event.date === dateStr);
    };

    const hasBookingOnDate = (date: Date | null) => {
        if (!date) return false;
        const dateStr = formatDateToString(date);
        return bookings.some(booking => booking.event.date === dateStr);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
        setSelectedDate(null);
        setShowAllBookings(false);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
        setShowAllBookings(false);
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarDays = getDaysInMonth(currentDate);
    const selectedDateBookings = getBookingsForDate(selectedDate);

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex-center">
                    <div className="text-foreground/60">Loading your bookings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">My Bookings</h1>
                    <p className="text-foreground/60">
                        {bookings.length === 0
                            ? "You don't have any bookings yet."
                            : `You have ${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}`
                        }
                    </p>
                </div>

                {bookings.length === 0 ? (
                    <div className="flex-center flex-col gap-4 py-20">
                        <Calendar className="w-16 h-16 text-foreground/20" />
                        <p className="text-foreground/60 text-lg">No bookings found</p>
                        <Link
                            href="/events"
                            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-blue/20 to-primary/20 text-blue border border-blue/30 hover:shadow-[0_0_25px_rgba(148,234,255,0.25)] transition-all duration-300"
                        >
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Calendar View */}
                        <div className="lg:col-span-2">
                            <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-blue/20 p-6">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="p-2 rounded-lg hover:bg-dark-100/50 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-foreground/80" />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-semibold text-foreground">
                                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                        </h2>
                                        <button
                                            onClick={goToToday}
                                            className="px-3 py-1 text-sm rounded-lg bg-blue/10 text-blue hover:bg-blue/20 transition-colors"
                                        >
                                            Today
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="p-2 rounded-lg hover:bg-dark-100/50 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-foreground/80" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {dayNames.map(day => (
                                        <div
                                            key={day}
                                            className="text-center text-sm font-medium text-foreground/60 py-2"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {calendarDays.map((date, index) => {
                                        const isToday = date &&
                                            date.toDateString() === new Date().toDateString();
                                        const hasBooking = hasBookingOnDate(date);
                                        const isSelected = selectedDate && date &&
                                            date.toDateString() === selectedDate.toDateString();

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (date) {
                                                        setSelectedDate(date);
                                                        setShowAllBookings(false);
                                                    }
                                                }}
                                                disabled={!date}
                                                className={`
                                                    aspect-square p-2 rounded-lg text-sm font-medium transition-all duration-200
                                                    ${!date ? 'cursor-default' : 'cursor-pointer hover:bg-dark-100/50'}
                                                    ${isToday ? 'bg-blue/20 border border-blue/40' : ''}
                                                    ${hasBooking && !isSelected ? 'bg-primary/20 border border-primary/40' : ''}
                                                    ${isSelected ? 'bg-blue/30 border-2 border-blue shadow-[0_0_15px_rgba(148,234,255,0.3)]' : ''}
                                                    ${date ? 'text-foreground' : 'text-transparent'}
                                                `}
                                            >
                                                {date?.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Selected Date Bookings */}
                        <div className="lg:col-span-1">
                            <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-blue/20 p-6 sticky top-32">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {showAllBookings
                                            ? 'All Bookings'
                                            : selectedDate
                                                ? formatDateToReadable(formatDateToString(selectedDate))
                                                : 'Select a date'
                                        }
                                    </h3>
                                    {!showAllBookings && bookings.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setShowAllBookings(true);
                                                setSelectedDate(null);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue/10 text-blue hover:bg-blue/20 transition-colors"
                                            title="Show all bookings"
                                        >
                                            <List className="w-3.5 h-3.5" />
                                            <span>All</span>
                                        </button>
                                    )}
                                </div>
                                {showAllBookings ? (
                                    bookings.length > 0 ? (
                                        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                                            {bookings.map(booking => (
                                                <Link
                                                    key={booking.id}
                                                    href={`/events/${booking.event.slug}`}
                                                    className="block p-4 rounded-lg bg-dark-100/50 border border-blue/10 hover:border-blue/30 hover:bg-dark-100/70 transition-all duration-200 group"
                                                >
                                                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={booking.event.image}
                                                            alt={booking.event.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-blue transition-colors">
                                                        {booking.event.title}
                                                    </h4>
                                                    <div className="space-y-1.5 text-sm text-foreground/60">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{formatDateToReadable(booking.event.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{formatTimeWithAMPM(booking.event.time)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span className="line-clamp-1">{booking.event.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-3.5 h-3.5" />
                                                            <span className="capitalize">{booking.event.mode}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-foreground/60 text-sm">
                                            No bookings found.
                                        </p>
                                    )
                                ) : selectedDate ? (
                                    selectedDateBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedDateBookings.map(booking => (
                                                <Link
                                                    key={booking.id}
                                                    href={`/events/${booking.event.slug}`}
                                                    className="block p-4 rounded-lg bg-dark-100/50 border border-blue/10 hover:border-blue/30 hover:bg-dark-100/70 transition-all duration-200 group"
                                                >
                                                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={booking.event.image}
                                                            alt={booking.event.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-blue transition-colors">
                                                        {booking.event.title}
                                                    </h4>
                                                    <div className="space-y-1.5 text-sm text-foreground/60">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{formatTimeWithAMPM(booking.event.time)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span className="line-clamp-1">{booking.event.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-3.5 h-3.5" />
                                                            <span className="capitalize">{booking.event.mode}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-foreground/60 text-sm">
                                            No bookings on this date.
                                        </p>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-foreground/60 text-sm">
                                            Click on a date with bookings to see details.
                                        </p>
                                        {bookings.length > 0 && (
                                            <button
                                                onClick={() => setShowAllBookings(true)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue/10 text-blue hover:bg-blue/20 border border-blue/20 transition-colors"
                                            >
                                                <List className="w-4 h-4" />
                                                <span>Show All Bookings</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* All Bookings List */}
                {bookings.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold text-foreground mb-6">All Bookings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookings.map(booking => (
                                <Link
                                    key={booking.id}
                                    href={`/events/${booking.event.slug}`}
                                    className="group bg-dark-200/50 backdrop-blur-xl rounded-xl border border-blue/20 overflow-hidden hover:border-blue/30 hover:shadow-[0_0_25px_rgba(148,234,255,0.15)] transition-all duration-300"
                                >
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={booking.event.image}
                                            alt={booking.event.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-blue transition-colors">
                                            {booking.event.title}
                                        </h3>
                                        <div className="space-y-2 text-sm text-foreground/60">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDateToReadable(booking.event.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatTimeWithAMPM(booking.event.time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="line-clamp-1">{booking.event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;

