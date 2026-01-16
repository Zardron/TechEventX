"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Calendar, MapPin, Clock, QrCode, User, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import QRCodeSVG from "react-qr-code";

interface TicketData {
    id: string;
    ticketNumber: string;
    qrCode: string;
    status: string;
    event: {
        title: string;
        date: string;
        time: string;
        location: string;
        venue: string;
        image: string;
        mode: string;
        organizer: string;
    };
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
}

export default function MyTicketPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("bookingId");
    const { token, isInitializing } = useAuth();
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait for auth initialization to complete
        if (isInitializing) {
            return;
        }

        if (bookingId && token) {
            fetchTicket();
        } else if (!token) {
            toast.error("Please login to view your ticket");
            router.push("/sign-in");
        } else if (!bookingId) {
            toast.error("Booking ID is required");
            router.push("/bookings");
        }
    }, [bookingId, token, isInitializing, router]);

    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/bookings/${bookingId}/ticket`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to fetch ticket");
            }

            const data = await response.json();
            // handleSuccessResponse spreads the data object, so ticket is directly in data.ticket
            setTicket(data.ticket || data.data?.ticket);
        } catch (error: any) {
            toast.error(error.message || "Failed to load ticket");
            router.push("/bookings");
        } finally {
            setIsLoading(false);
        }
    };

    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-light-200">Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2 text-light-100">Ticket Not Found</h1>
                    <p className="text-light-200 mb-4">The ticket for this booking doesn't exist.</p>
                    <Link href="/bookings">
                        <Button>Back to Bookings</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <Link href="/bookings">
                    <Button variant="ghost" className="mb-6 text-light-200 hover:text-light-100">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Bookings
                    </Button>
                </Link>

                {/* Main Container - Centered with 2 Columns */}
                <div className="glass rounded-md border border-border-dark/50 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 md:p-8 border-b border-border-dark/50">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gradient">Your Ticket</h1>
                        <p className="text-light-200">Ticket #{ticket.ticketNumber}</p>
                    </div>

                    {/* Two Column Layout */}
                    <div className="p-6 md:p-8 lg:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Left Column - QR Code */}
                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="w-full max-w-sm">
                                    <div className="bg-dark-200/30 rounded-md p-8 border border-border-dark/30 text-center">
                                        <QrCode className="w-8 h-8 mx-auto mb-4 text-primary" />
                                        <h3 className="text-xl font-semibold mb-6 text-light-100">QR Code</h3>
                                        <div className="bg-white p-6 rounded-md inline-block shadow-lg">
                                            <QRCodeSVG
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${ticket.ticketNumber}`}
                                                size={250}
                                                bgColor="#FFFFFF"
                                                fgColor="#000000"
                                                level="M"
                                            />
                                        </div>
                                        <p className="text-sm text-light-200 mt-6">
                                            Show this QR code at the event entrance
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Ticket Number */}
                                <div className="w-full max-w-sm p-4 border border-border-dark/30 rounded-md bg-dark-200/20">
                                    <p className="text-xs text-light-200 uppercase tracking-wider mb-2">Ticket Number</p>
                                    <p className="font-mono font-bold text-lg text-primary">{ticket.ticketNumber}</p>
                                </div>
                            </div>

                            {/* Right Column - Event Details & User Details */}
                            <div className="space-y-8">
                                {/* Event Details Section */}
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-light-100">{ticket.event.title}</h2>
                                    
                                    {/* Event Image */}
                                    <div className="relative w-full h-48 md:h-64 rounded-md overflow-hidden mb-6 border border-border-dark/30">
                                        <Image
                                            src={ticket.event.image}
                                            alt={ticket.event.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>

                                    {/* Event Information Cards */}
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                            <Calendar className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Date</p>
                                                <p className="font-semibold text-light-100">{formatDateToReadable(ticket.event.date)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                            <Clock className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Time</p>
                                                <p className="font-semibold text-light-100">{formatDateTo12Hour(ticket.event.time)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                            <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Location</p>
                                                <p className="font-semibold text-light-100">{ticket.event.location}</p>
                                                <p className="text-sm text-light-200 mt-1">{ticket.event.venue}</p>
                                            </div>
                                        </div>

                                        {ticket.event.mode && (
                                            <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                                <div className="w-5 h-5 mt-1 shrink-0 flex items-center justify-center">
                                                    <span className="text-primary text-xs">📍</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Mode</p>
                                                    <p className="font-semibold text-light-100 capitalize">{ticket.event.mode}</p>
                                                </div>
                                            </div>
                                        )}

                                        {ticket.event.organizer && (
                                            <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                                <div className="w-5 h-5 mt-1 shrink-0 flex items-center justify-center">
                                                    <span className="text-primary text-xs">👤</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Organizer</p>
                                                    <p className="font-semibold text-light-100">{ticket.event.organizer}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User Details Section */}
                                <div className="pt-6 border-t border-border-dark/30">
                                    <h3 className="text-xl font-bold mb-4 text-light-100">Attendee Information</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                            <User className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Name</p>
                                                <p className="font-semibold text-light-100">{ticket.user.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-md bg-dark-200/20 hover:bg-dark-200/30 transition-colors duration-200 border border-border-dark/30">
                                            <Mail className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs text-light-200 uppercase tracking-wider mb-1">Email</p>
                                                <p className="font-semibold text-light-100">{ticket.user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

