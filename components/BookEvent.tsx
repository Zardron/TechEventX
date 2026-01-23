"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCreateBooking, useHasBookedEvent } from "@/lib/hooks/api/bookings.queries";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEventBySlug } from "@/lib/hooks/api/events.queries";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";

interface BookEventProps {
    eventSlug: string;
}

const BookEvent = ({ eventSlug }: BookEventProps) => {
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { hasBooked } = useHasBookedEvent(eventSlug);
    const createBookingMutation = useCreateBooking();
    const { token } = useAuthStore();
    const { data: eventData } = useEventBySlug(eventSlug);
    const event = (eventData as any)?.data?.event || (eventData as any)?.event;
    const isPaidEvent = event && !event.isFree && event.price;

    useEffect(() => {
        setMounted(true);
        
        // Check for payment success/cancel in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const paymentIntentId = urlParams.get('intent');
        
        if (paymentStatus === 'success' && paymentIntentId) {
            // Payment was successful, create booking
            handleCreateBookingAfterPayment(paymentIntentId);
        } else if (paymentStatus === 'cancel') {
            toast.error('Payment was cancelled');
            // Clean up URL
            router.replace(`/events/${eventSlug}`);
        }
    }, []);

    const handleCreateBookingAfterPayment = async (paymentIntentId: string) => {
        if (!token) {
            toast.error('Authentication required');
            return;
        }

        setIsProcessingPayment(true);
        try {
            // Create booking with payment intent ID
            createBookingMutation.mutate({
                eventSlug,
                paymentIntentId,
            }, {
                onSuccess: () => {
                    toast.success('Booking confirmed!');
                    // Clean up URL
                    router.replace(`/events/${eventSlug}`);
                },
                onError: (error: any) => {
                    toast.error(error.message || 'Failed to create booking');
                },
                onSettled: () => {
                    setIsProcessingPayment(false);
                }
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to process booking');
            setIsProcessingPayment(false);
        }
    };

    const handleBookNowClick = async () => {
        if (!isAuthenticated) {
            router.push('/sign-in');
            return;
        }

        // If paid event, create payment intent and redirect to PayMongo checkout
        if (isPaidEvent) {
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            setIsProcessingPayment(true);
            try {
                // Create payment intent
                const response = await fetch('/api/payments/create-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        eventSlug,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to create payment intent');
                }

                const { paymentIntentId } = data.data || data;

                if (!paymentIntentId) {
                    throw new Error('Payment intent ID not received');
                }

                // Create checkout session and redirect to PayMongo
                const checkoutResponse = await fetch('/api/bookings/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paymentIntentId,
                        paymentMethodType: 'gcash', // Default to GCash, PayMongo will show all options
                    }),
                });

                const checkoutData = await checkoutResponse.json();

                if (!checkoutResponse.ok) {
                    throw new Error(checkoutData.message || 'Failed to create checkout session');
                }

                const checkoutUrl = checkoutData.data?.checkoutUrl || checkoutData.checkoutUrl;

                if (!checkoutUrl) {
                    throw new Error('Checkout URL not received');
                }

                // Redirect to PayMongo checkout
                window.location.href = checkoutUrl;
            } catch (error: any) {
                console.error('Payment error:', error);
                toast.error(error.message || 'Failed to process payment');
                setIsProcessingPayment(false);
            }
        } else {
            // Free event - show confirmation
            setShowConfirmation(true);
        }
    };

    const handleConfirmBooking = () => {
        setShowConfirmation(false);
        createBookingMutation.mutate({
            eventSlug,
        }, {
            onError: (error) => {
                // Error is handled by the mutation state
            },
        });
    };

    const handleCancelBooking = () => {
        setShowConfirmation(false);
    };

    const isLoading = createBookingMutation.isPending;
    const error = createBookingMutation.isError ? createBookingMutation.error : null;
    const isBooked = hasBooked || createBookingMutation.isSuccess;
    const bookingResponse = createBookingMutation.data?.data;
    const paymentStatus = bookingResponse?.booking?.paymentStatus;
    const isAdminOrOrganizer = user?.role === 'admin' || user?.role === 'organizer';
    const bookingId = bookingResponse?.booking?.id;

    // Redirect to ticket page when booking is confirmed
    useEffect(() => {
        if (createBookingMutation.isSuccess && bookingId) {
            // Only redirect if booking is confirmed (free events or confirmed payment status)
            const isConfirmed = !isPaidEvent || paymentStatus === 'confirmed' || !paymentStatus;
            if (isConfirmed) {
                // Small delay to show success message before opening ticket in new tab
                const timer = setTimeout(() => {
                    window.open(`/my-ticket?bookingId=${bookingId}`, '_blank', 'noopener,noreferrer');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [createBookingMutation.isSuccess, bookingId, paymentStatus, isPaidEvent, router]);

    return (
        <>
            <div id="book-event">
                {isBooked ? (
                    <div className="flex flex-col items-center gap-4 text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-light-100 text-base font-medium">
                            {hasBooked ? "You've already booked this event!" : "Thank you for booking your spot!"}
                        </p>
                        <p className="text-light-200 text-sm">
                            {hasBooked 
                                ? "Your spot is confirmed. Please check your email for updates." 
                                : isPaidEvent && paymentStatus === 'pending'
                                    ? "Your booking is pending payment confirmation. Please wait up to 24 hours for email confirmation."
                                    : "Your booking has been confirmed. Please wait for an email update with further details."}
                        </p>
                    </div>
                ) : isAdminOrOrganizer ? (
                    <div className="flex flex-col items-center gap-4 text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <p className="text-light-100 text-base font-medium">
                            Booking not available
                        </p>
                        <p className="text-light-200 text-sm">
                            {user?.role === 'admin' 
                                ? "Admins cannot book events." 
                                : "Organizers cannot book events."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
                                <p className="text-red-400 text-sm">
                                    {error instanceof Error ? error.message : 'An error occurred while booking'}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={handleBookNowClick}
                            className="button-submit w-full"
                            disabled={isLoading || isAdminOrOrganizer || isProcessingPayment}
                        >
                            {(isLoading || isProcessingPayment) ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isProcessingPayment ? 'Processing...' : 'Booking...'}
                                </span>
                            ) : (
                                'Book Now'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {mounted && showConfirmation && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-md p-6 md:p-8 border border-primary/30 max-w-md w-full card-shadow" style={{ boxShadow: '0 0 20px rgba(89, 222, 202, 0.2), 0 0 40px rgba(89, 222, 202, 0.1)' }}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-light-100">Confirm Booking</h3>
                            <p className="text-light-200 text-base">
                                Are you sure you want to be part of this event?
                            </p>
                            <div className="flex gap-3 w-full mt-6">
                                <button
                                    onClick={handleCancelBooking}
                                    className="flex-1 px-4 py-2.5 rounded-md bg-dark-200/50 border border-border-dark/50 text-light-100 font-medium hover:bg-dark-200/70 transition-colors duration-200"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    className="flex-1 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors duration-200"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Booking...
                                        </span>
                                    ) : (
                                        'Confirm'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

export default BookEvent
