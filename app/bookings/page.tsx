"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import QRCodeSVG from "react-qr-code";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Monitor,
  List,
  X,
  ArrowLeft,
  QrCode,
  Download,
  UserPlus,
  FileText,
  Calendar as CalendarIcon,
  User,
  Mail,
  Loader2,
} from "lucide-react";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import { useBookings } from "@/lib/hooks/api/bookings.queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useAuth } from "@/lib/hooks/use-auth";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";

interface TicketData {
  id: string;
  ticketNumber: string;
  qrCode: string;
  status: string;
  bookingId: string;
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
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const BookingsPage = () => {
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get("id");
  const ticketNumberParam = searchParams.get("ticketNumber");

  const { data: bookingsData, isLoading: loading, error } = useBookings();
  const bookings = bookingsData?.bookings || [];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "upcoming" | "past" | "cancelled"
  >("all");
  const { token, isInitializing } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Ticket view state
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const transferMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!token) throw new Error("Not authenticated");
      if (!ticketNumberParam) throw new Error("Ticket number is required");

      const response = await fetch(
        `/api/tickets/${ticketNumberParam}/transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipientEmail: email }),
        }
      );

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
      if (ticketNumberParam) {
        fetchTicket();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to transfer ticket");
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel booking");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const fetchTicket = async () => {
    if (!ticketNumberParam || !token) {
      return;
    }

    setIsLoadingTicket(true);
    try {
      const response = await fetch(`/api/tickets/${ticketNumberParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          // Don't show error here, let the UI handle it
          setTicket(null);
          setIsLoadingTicket(false);
          return;
        }
        throw new Error(data.message || "Failed to fetch ticket");
      }

      const data = await response.json();
      // handleSuccessResponse spreads the data object, so ticket is directly in data.ticket
      const ticketData = data.ticket || data.data?.ticket;
      if (!ticketData) {
        console.error("Ticket data not found in response:", data);
        setTicket(null);
        setIsLoadingTicket(false);
        return;
      }
      setTicket(ticketData);

      // If bookingId is missing from URL but available in ticket, update URL
      if (!bookingIdParam && ticketData.bookingId) {
        const newUrl = `/bookings?id=${ticketData.bookingId}&ticketNumber=${ticketNumberParam}`;
        window.history.replaceState({}, "", newUrl);
      } else if (bookingIdParam === "undefined" && ticketData.bookingId) {
        // Handle case where id=undefined is in URL
        const newUrl = `/bookings?id=${ticketData.bookingId}&ticketNumber=${ticketNumberParam}`;
        window.history.replaceState({}, "", newUrl);
      }
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      setTicket(null);
    } finally {
      setIsLoadingTicket(false);
    }
  };

  useEffect(() => {
    // Wait for auth initialization to complete
    if (isInitializing) {
      return;
    }

    // Only fetch if we have ticketNumber and token
    if (ticketNumberParam) {
      if (token) {
        fetchTicket();
      } else {
        // No token after initialization - user needs to login
        setIsLoadingTicket(false);
        setTicket(null);
      }
    }
  }, [ticketNumberParam, token, isInitializing]);

  const handleCancelBooking = async (bookingId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to cancel your booking for "${eventTitle}"?`
      )
    ) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
    } finally {
      setCancellingId(null);
    }
  };

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
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = formatDateToString(date);
    return bookings.filter((booking) => booking.event.date === dateStr);
  };

  const hasBookingOnDate = (date: Date | null) => {
    if (!date) return false;
    const dateStr = formatDateToString(date);
    return bookings.some((booking) => booking.event.date === dateStr);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = getDaysInMonth(currentDate);
  const selectedDateBookings = getBookingsForDate(selectedDate);

  // Show ticket view if ticketNumber is in query params
  if (ticketNumberParam) {
    // Wait for auth initialization
    if (isInitializing || isLoadingTicket) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading ticket...</div>
        </div>
      );
    }

    // Show login prompt if no token after initialization
    if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">
              Please login to view your ticket.
            </p>
            <Link href="/sign-in">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </div>
      );
    }

    // Only show "not found" if we have token but no ticket data
    if (!ticket) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The ticket doesn't exist or you don't have access to it.
            </p>
            <Link href="/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="py-12 px-4">
        <div className="flex flex-col items-center justify-center">
          <div className="absolute top-10 left-0">
            <Link href="/bookings">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Button>
            </Link>
          </div>

          <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
           

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Event Details */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">
                      {ticket.event.title}
                    </h2>
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
                    {ticket.user && (
                      <>
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Attendee
                            </p>
                            <p className="font-medium">{ticket.user.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Email
                            </p>
                            <p className="font-medium">{ticket.user.email}</p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {formatDateToReadable(ticket.event.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {formatDateTo12Hour(ticket.event.time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Location
                        </p>
                        <p className="font-medium">{ticket.event.location}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.event.venue}
                        </p>
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

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Ticket Number
                    </p>
                    <p className="font-mono font-bold text-lg">
                      {ticket.ticketNumber}
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
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
                        toast.error(
                          error.message || "Failed to download ticket"
                        );
                      } finally {
                        setIsDownloading(false);
                      }
                    }}
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
                        Download Ticket
                      </>
                    )}
                  </Button>

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
                          onClick={() =>
                            transferMutation.mutate(recipientEmail)
                          }
                          disabled={
                            transferMutation.isPending || !recipientEmail
                          }
                          className="flex-1"
                        >
                          {transferMutation.isPending
                            ? "Transferring..."
                            : "Transfer"}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex-center flex-col gap-4 py-20">
          <p className="text-foreground/60 text-lg">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
                    onClick={() => navigateMonth("prev")}
                    className="p-2 rounded-lg hover:bg-dark-100/50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground/80" />
                  </button>
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      {monthNames[currentDate.getMonth()]}{" "}
                      {currentDate.getFullYear()}
                    </h2>
                    <button
                      onClick={goToToday}
                      className="px-3 py-1 text-sm rounded-lg bg-blue/10 text-blue hover:bg-blue/20 transition-colors"
                    >
                      Today
                    </button>
                  </div>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 rounded-lg hover:bg-dark-100/50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground/80" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {dayNames.map((day) => (
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
                    const isToday =
                      date && date.toDateString() === new Date().toDateString();
                    const hasBooking = hasBookingOnDate(date);
                    const isSelected =
                      selectedDate &&
                      date &&
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
                                                    ${
                                                      !date
                                                        ? "cursor-default"
                                                        : "cursor-pointer hover:bg-dark-100/50"
                                                    }
                                                    ${
                                                      isToday
                                                        ? "bg-blue/20 border border-blue/40"
                                                        : ""
                                                    }
                                                    ${
                                                      hasBooking && !isSelected
                                                        ? "bg-primary/20 border border-primary/40"
                                                        : ""
                                                    }
                                                    ${
                                                      isSelected
                                                        ? "bg-blue/30 border-2 border-blue shadow-[0_0_15px_rgba(148,234,255,0.3)]"
                                                        : ""
                                                    }
                                                    ${
                                                      date
                                                        ? "text-foreground"
                                                        : "text-transparent"
                                                    }
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
              <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-blue/20 p-6 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {showAllBookings
                      ? "All Bookings"
                      : selectedDate
                      ? formatDateToReadable(formatDateToString(selectedDate))
                      : "Select a date"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {showAllBookings && (
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-blue/10 text-blue border border-blue/20 focus:outline-none focus:ring-2 focus:ring-blue/50"
                      >
                        <option value="all">All</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
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
                </div>
                {showAllBookings ? (
                  bookings.length > 0 ? (
                    <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                      {bookings
                        .filter((booking: any) => {
                          if (filterStatus === "all") return true;
                          const eventDate = new Date(booking.event.date);
                          const now = new Date();
                          if (filterStatus === "upcoming")
                            return eventDate >= now;
                          if (filterStatus === "past") return eventDate < now;
                          if (filterStatus === "cancelled")
                            return booking.status === "cancelled";
                          return true;
                        })
                        .map((booking: any) => (
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
                                <span>
                                  {formatDateToReadable(booking.event.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {formatDateTo12Hour(booking.event.time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="line-clamp-1">
                                  {booking.event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" />
                                <span className="capitalize">
                                  {booking.event.mode}
                                </span>
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
                      {selectedDateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="block p-4 rounded-lg bg-dark-100/50 border border-blue/10 hover:border-blue/30 hover:bg-dark-100/70 transition-all duration-200 group"
                        >
                          <Link
                            href={`/events/${booking.event.slug}`}
                            className="block"
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
                                <span>
                                  {formatDateTo12Hour(booking.event.time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="line-clamp-1">
                                  {booking.event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" />
                                <span className="capitalize">
                                  {booking.event.mode}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
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
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              All Bookings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group bg-dark-200/50 backdrop-blur-xl rounded-xl border border-blue/20 overflow-hidden hover:border-blue/30 hover:shadow-[0_0_25px_rgba(148,234,255,0.15)] transition-all duration-300"
                >
                  <Link href={`/events/${booking.event.slug}`}>
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
                          <span>
                            {formatDateToReadable(booking.event.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTo12Hour(booking.event.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">
                            {booking.event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="p-5 pt-0 flex items-center justify-between">
                    {booking.ticketNumber && (booking.paymentStatus === 'confirmed' || !booking.paymentStatus) && (
                      <Link
                        href={`/bookings?id=${booking.id}&ticketNumber=${booking.ticketNumber}`}
                        className="text-sm text-blue hover:underline"
                      >
                        View Ticket →
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCancelBooking(booking.id, booking.event.title)
                      }
                      disabled={cancellingId === booking.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
