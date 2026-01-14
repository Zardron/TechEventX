"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Calendar, MapPin, Clock, QrCode, Download, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import toast from "react-hot-toast";
import QRCodeSVG from "react-qr-code";

interface TicketData {
    id: string;
    ticketNumber: string;
    qrCode: string;
    status: string;
    bookingId?: string;
    event: {
        title: string;
        date: string;
        time: string;
        location: string;
        venue: string;
        image: string;
    };
    booking: {
        createdAt: string;
    };
}

export default function TicketPage() {
    const params = useParams();
    const router = useRouter();
    const ticketNumber = params.ticketNumber as string;
    const { token, isInitializing } = useAuth();
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        // Wait for auth initialization to complete
        if (isInitializing) {
            return;
        }

        if (!token) {
            toast.error("Please login to view your ticket");
            router.push("/sign-in");
            return;
        }
        
        if (ticketNumber && token) {
            fetchTicket();
        } else if (!ticketNumber) {
            toast.error("Ticket number is required");
            setIsLoading(false);
        }
    }, [ticketNumber, token, isInitializing, router]);

    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/tickets/${ticketNumber}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 401 || response.status === 403) {
                    toast.error("Please login to view your ticket");
                    router.push("/sign-in");
                    return;
                }
                throw new Error(data.message || "Failed to fetch ticket");
            }

            const data = await response.json();
            // handleSuccessResponse spreads the data object, so ticket is directly in data.ticket
            const ticketData = data.ticket || data.data?.ticket;
            setTicket(ticketData);
            
            // Redirect to /bookings?id=[bookingId]&ticketNumber=[ticketNumber]
            if (ticketData.bookingId) {
                router.push(`/bookings?id=${ticketData.bookingId}&ticketNumber=${ticketNumber}`);
            } else {
                // If bookingId is not available, still redirect but fetch it from the ticket
                toast.error("Booking ID not found. Redirecting...");
                setIsLoading(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load ticket");
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!ticket || !token) {
            toast.error("Ticket information is not available");
            return;
        }
        
        setIsDownloading(true);
        try {
            const response = await fetch(
                `/api/tickets/${ticket.ticketNumber}/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate ticket PDF");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ticket-${ticket.ticketNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Ticket downloaded successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to download ticket");
        } finally {
            setIsDownloading(false);
        }
    };

    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">Loading ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
                    <p className="text-muted-foreground">The ticket you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Your Ticket</h1>
                                <p className="text-muted-foreground">Ticket #{ticket.ticketNumber}</p>
                            </div>
                            <div className="text-right">
                                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                                    ticket.status === 'used'
                                        ? 'bg-green-500/10 text-green-500'
                                        : ticket.status === 'cancelled'
                                        ? 'bg-red-500/10 text-red-500'
                                        : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {ticket.status.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Event Details */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-4">{ticket.event.title}</h2>
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                                        <Image
                                            src={ticket.event.image}
                                            alt={ticket.event.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Date</p>
                                            <p className="font-medium">{formatDateToReadable(ticket.event.date)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Time</p>
                                            <p className="font-medium">{formatDateTo12Hour(ticket.event.time)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{ticket.event.location}</p>
                                            <p className="text-sm text-muted-foreground">{ticket.event.venue}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="space-y-6">
                                <div className="bg-muted/50 p-6 rounded-lg text-center">
                                    <QrCode className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-semibold mb-4">QR Code</h3>
                                    <div className="bg-white p-4 rounded-lg inline-block">
                                        <QRCodeSVG
                                            value={JSON.stringify({
                                                ticketNumber: ticket.ticketNumber,
                                                bookingId: ticket.bookingId || '',
                                                timestamp: Date.now(),
                                            })}
                                            size={200}
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                            level="M"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        Show this QR code at the event entrance
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Ticket Number</p>
                                        <p className="font-mono font-bold text-lg">{ticket.ticketNumber}</p>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Booked On</p>
                                        <p className="font-medium">
                                            {new Date(ticket.booking.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {ticket.status === 'used' && (
                                        <div className="flex items-center gap-2 text-green-500 p-4 border border-green-500/20 rounded-lg bg-green-500/10">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Already Checked In</span>
                                        </div>
                                    )}

                                    <Button 
                                        onClick={handleDownload} 
                                        variant="outline" 
                                        className="w-full"
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating PDF...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                Download PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

