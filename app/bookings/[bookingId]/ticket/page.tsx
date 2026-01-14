"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Calendar, MapPin, Clock, QrCode, Download, ArrowLeft, UserPlus, FileText, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import Link from "next/link";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
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
    };
}

export default function BookingTicketPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = params.bookingId as string;
    const ticketNumberFromQuery = searchParams.get("ticketNumber");
    const { token, isInitializing } = useAuth();
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");

    const transferMutation = useMutation({
        mutationFn: async (email: string) => {
            if (!token) throw new Error("Not authenticated");
            
            // Get ticket number from current ticket state or fetch it
            const ticketNumber = ticket?.ticketNumber || ticketNumberFromQuery;
            if (!ticketNumber) {
                throw new Error("Ticket number is required");
            }

            const response = await fetch(`/api/tickets/${ticketNumber}/transfer`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ recipientEmail: email }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to transfer ticket");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success("Ticket transferred successfully");
            setShowTransferForm(false);
            setRecipientEmail("");
            // Refresh ticket data using the appropriate method
            if (ticketNumberFromQuery) {
                fetchTicketByNumber();
            } else if (bookingId) {
                fetchTicket();
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to transfer ticket");
        },
    });

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
        
        // If ticketNumber is in query params, use it to fetch ticket directly
        // Otherwise, use bookingId if available
        if (ticketNumberFromQuery && token) {
            fetchTicketByNumber();
        } else if (bookingId && token) {
            fetchTicket();
        } else if (!bookingId && !ticketNumberFromQuery) {
            toast.error("Booking ID or Ticket Number is required");
            setIsLoading(false);
        }
    }, [bookingId, ticketNumberFromQuery, token, isInitializing, router]);

    const fetchTicketByNumber = async () => {
        if (!ticketNumberFromQuery || !token) return;
        
        try {
            const response = await fetch(`/api/tickets/${ticketNumberFromQuery}`, {
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
            const ticketData = data.data.ticket;
            setTicket({
                id: ticketData.id,
                ticketNumber: ticketData.ticketNumber,
                qrCode: ticketData.qrCode,
                status: ticketData.status,
                event: ticketData.event,
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to load ticket");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTicket = async () => {
        if (!bookingId || !token) return;
        
        try {
            const response = await fetch(`/api/bookings/${bookingId}/ticket`, {
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
            setTicket(data.data.ticket);
        } catch (error: any) {
            toast.error(error.message || "Failed to load ticket");
        } finally {
            setIsLoading(false);
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
                    <p className="text-muted-foreground mb-4">The ticket for this booking doesn't exist.</p>
                    <Link href="/bookings">
                        <Button>Back to Bookings</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/bookings">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Bookings
                    </Button>
                </Link>

                <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8 border-b">
                        <h1 className="text-3xl font-bold mb-2">Your Ticket</h1>
                        <p className="text-muted-foreground">Ticket #{ticket.ticketNumber}</p>
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
                                                bookingId: bookingId || '',
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

                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">Ticket Number</p>
                                    <p className="font-mono font-bold text-lg">{ticket.ticketNumber}</p>
                                </div>

                                <div className="space-y-2">
                                    <Button onClick={() => {
                                        const bookingIdToUse = bookingId || (ticket as any).bookingId;
                                        window.open(`/bookings?id=${bookingIdToUse}&ticketNumber=${ticket.ticketNumber}`, '_blank', 'noopener,noreferrer');
                                    }} variant="outline" className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        View Full Ticket
                                    </Button>
                                    
                                    {bookingId && (
                                        <>
                                            <Button 
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/bookings/${bookingId}/calendar`, {
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (!response.ok) throw new Error("Failed to generate calendar file");
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement("a");
                                                        a.href = url;
                                                        a.download = `event-${ticket.event.title.replace(/\s+/g, '-')}.ics`;
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                        toast.success("Calendar file downloaded");
                                                    } catch (error: any) {
                                                        toast.error(error.message || "Failed to download calendar");
                                                    }
                                                }}
                                                variant="outline" 
                                                className="w-full"
                                            >
                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                Add to Calendar
                                            </Button>

                                            <Button 
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/bookings/${bookingId}/invoice`, {
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (!response.ok) throw new Error("Failed to generate invoice");
                                                        const data = await response.json();
                                                // Generate PDF-like HTML invoice
                                                const invoice = data.data.invoice;
                                                const htmlContent = `
                                                    <!DOCTYPE html>
                                                    <html>
                                                    <head>
                                                        <title>Invoice ${invoice.invoiceNumber}</title>
                                                        <style>
                                                            body { font-family: Arial, sans-serif; padding: 20px; }
                                                            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                                                            .invoice-details { float: right; text-align: right; }
                                                            .customer-details { margin: 20px 0; }
                                                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                                            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                                                            th { background-color: #f2f2f2; }
                                                            .total { text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 20px; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="header">
                                                            <h1>INVOICE</h1>
                                                            <div class="invoice-details">
                                                                <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                                                                <p><strong>Date:</strong> ${invoice.date}</p>
                                                            </div>
                                                        </div>
                                                        <div class="customer-details">
                                                            <h3>Bill To:</h3>
                                                            <p>${invoice.customer.name}</p>
                                                            <p>${invoice.customer.email}</p>
                                                        </div>
                                                        <h3>Event Details:</h3>
                                                        <p><strong>${invoice.event.title}</strong></p>
                                                        <p>${invoice.event.date} at ${invoice.event.time}</p>
                                                        <p>${invoice.event.location}</p>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Description</th>
                                                                    <th>Quantity</th>
                                                                    <th>Unit Price</th>
                                                                    <th>Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${invoice.items.map((item: any) => `
                                                                    <tr>
                                                                        <td>${item.description}</td>
                                                                        <td>${item.quantity}</td>
                                                                        <td>₱${item.unitPrice.toFixed(2)}</td>
                                                                        <td>₱${item.total.toFixed(2)}</td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                        ${invoice.discount > 0 ? `<p style="text-align: right;">Discount: -₱${invoice.discount.toFixed(2)}</p>` : ''}
                                                        <div class="total">
                                                            <p>Total: ₱${invoice.total.toFixed(2)}</p>
                                                            <p>Payment Method: ${invoice.paymentMethod}</p>
                                                            <p>Status: ${invoice.status}</p>
                                                        </div>
                                                    </body>
                                                    </html>
                                                `;
                                                const printWindow = window.open('', '_blank');
                                                if (printWindow) {
                                                    printWindow.document.write(htmlContent);
                                                    printWindow.document.close();
                                                    printWindow.print();
                                                }
                                            } catch (error: any) {
                                                toast.error(error.message || "Failed to generate invoice");
                                            }
                                        }}
                                        variant="outline" 
                                        className="w-full"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Download Invoice
                                    </Button>
                                        </>
                                    )}
                                    
                                    {ticket.status === 'active' && (
                                        <Button 
                                            onClick={() => setShowTransferForm(true)}
                                            variant="outline" 
                                            className="w-full"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Transfer Ticket
                                        </Button>
                                    )}
                                </div>

                                {showTransferForm && (
                                    <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                                        <h3 className="font-semibold">Transfer Ticket</h3>
                                        <FormInput
                                            label="Recipient Email"
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => transferMutation.mutate(recipientEmail)}
                                                disabled={transferMutation.isPending || !recipientEmail}
                                                className="flex-1"
                                            >
                                                {transferMutation.isPending ? "Transferring..." : "Transfer"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowTransferForm(false);
                                                    setRecipientEmail("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

