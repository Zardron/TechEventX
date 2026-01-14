"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCreateBooking, useHasBookedEvent } from "@/lib/hooks/api/bookings.queries";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEventBySlug } from "@/lib/hooks/api/events.queries";
import { useAuthStore } from "@/lib/store/auth.store";
import Image from "next/image";
import toast from "react-hot-toast";

interface BookEventProps {
    eventSlug: string;
}

const BookEvent = ({ eventSlug }: BookEventProps) => {
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
    const [activePaymentTab, setActivePaymentTab] = useState<'bank' | 'ewallet' | 'qr'>('bank');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
    const [receiptUrl, setReceiptUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { hasBooked } = useHasBookedEvent(eventSlug);
    const createBookingMutation = useCreateBooking();
    const { token } = useAuthStore();
    const { data: eventData } = useEventBySlug(eventSlug);
    const event = eventData?.data?.event || eventData?.event;
    const isPaidEvent = event && !event.isFree && event.price;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Debug: Log event data to check payment methods
    useEffect(() => {
        if (event) {
            console.log("📋 BookEvent - Event data:", event);
            console.log("📋 BookEvent - Payment methods:", event.paymentMethods);
            console.log("📋 BookEvent - Payment details:", event.paymentDetails);
            console.log("📋 BookEvent - Is paid event:", isPaidEvent);
        }
    }, [event, isPaidEvent]);

    // Group payment methods by category
    const groupPaymentMethods = () => {
        if (!event?.paymentMethods) return { bank: [], ewallet: [], qr: [] };

        const bankMethods = event.paymentMethods.filter((m: string) => m === 'bank_transfer');
        const ewalletMethods = event.paymentMethods.filter((m: string) => 
            ['gcash', 'paymaya', 'grabpay', 'grab_pay'].includes(m)
        );
        const qrMethods = event.paymentMethods.filter((m: string) => 
            ['qr', 'qr_ph', 'qr_gcash', 'qr_paymaya'].includes(m)
        );

        return { bank: bankMethods, ewallet: ewalletMethods, qr: qrMethods };
    };

    // Get first available payment method in a tab
    const getFirstAvailableMethod = (tab: 'bank' | 'ewallet' | 'qr') => {
        const groups = groupPaymentMethods();
        const methods = groups[tab];
        return methods.length > 0 ? methods[0] : null;
    };

    // Auto-select first available payment method when tab changes or event data loads
    useEffect(() => {
        if (showPaymentModal && event) {
            const groups = groupPaymentMethods();
            const firstMethod = getFirstAvailableMethod(activePaymentTab);
            if (firstMethod) {
                // Only auto-select if no method is selected or current selection is not in active tab
                if (!selectedPaymentMethod || !groups[activePaymentTab].includes(selectedPaymentMethod)) {
                    setSelectedPaymentMethod(firstMethod);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePaymentTab, showPaymentModal, event]);

    const handleBookNowClick = () => {
        if (!isAuthenticated) {
            router.push('/sign-in');
            return;
        }

        // If paid event, show payment modal first
        if (isPaidEvent) {
            // Set active tab to first available payment method category
            const groups = groupPaymentMethods();
            let activeTab: 'bank' | 'ewallet' | 'qr' = 'bank';
            if (groups.bank.length > 0) {
                activeTab = 'bank';
            } else if (groups.ewallet.length > 0) {
                activeTab = 'ewallet';
            } else if (groups.qr.length > 0) {
                activeTab = 'qr';
            }
            setActivePaymentTab(activeTab);
            // Auto-select first available payment method
            const firstMethod = getFirstAvailableMethod(activeTab);
            if (firstMethod) {
                setSelectedPaymentMethod(firstMethod);
            }
            setShowPaymentModal(true);
        } else {
            setShowConfirmation(true);
        }
    };

    const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setReceiptFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            // Auto-upload the receipt
            if (token) {
                setIsUploadingReceipt(true);
                try {
                    const formData = new FormData();
                    formData.append('receipt', file);

                    console.log('📤 Sending receipt upload request...', {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                    });

                    const response = await fetch('/api/bookings/receipt', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    });

                    console.log('📥 Response status:', response.status, response.statusText);

                    let data;
                    try {
                        const text = await response.text();
                        console.log('📥 Response text:', text);
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.error('❌ Failed to parse response as JSON:', parseError);
                        throw new Error('Invalid response from server');
                    }

                    console.log('📥 Receipt upload response data:', data);

                    if (!response.ok) {
                        console.error('❌ Receipt upload failed - Response not OK:', {
                            status: response.status,
                            statusText: response.statusText,
                            data: data,
                        });
                        throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
                    }

                    // Handle multiple response formats:
                    // 1. { message: "...", receiptUrl: "..." } - direct format from handleSuccessResponse
                    // 2. { data: { receiptUrl: "..." } } - nested format
                    // 3. { receiptUrl: "..." } - simple format
                    const receiptUrl = data.receiptUrl || data.data?.receiptUrl;
                    
                    console.log('🔍 Extracted receipt URL:', receiptUrl);
                    console.log('🔍 Full response structure:', JSON.stringify(data, null, 2));
                    
                    if (!receiptUrl) {
                        console.error('❌ Receipt upload response missing URL. Full response:', data);
                        throw new Error('Upload succeeded but no receipt URL returned');
                    }

                    setReceiptUrl(receiptUrl);
                    toast.success('Receipt uploaded successfully');
                    console.log('✅ Receipt URL set successfully:', receiptUrl);
                } catch (error) {
                    console.error('❌ Receipt upload error details:', {
                        error: error,
                        message: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined,
                    });
                    const errorMessage = error instanceof Error ? error.message : 'Failed to upload receipt';
                    toast.error(errorMessage);
                    // Don't clear the file on error, allow retry
                } finally {
                    setIsUploadingReceipt(false);
                }
            } else {
                console.error('❌ No token available for upload');
                toast.error('Authentication required. Please sign in again.');
            }
        }
    };

    const handleUploadReceipt = async () => {
        if (!receiptFile || !token) return;

        setIsUploadingReceipt(true);
        try {
            const formData = new FormData();
            formData.append('receipt', receiptFile);

            const response = await fetch('/api/bookings/receipt', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            let data;
            try {
                const text = await response.text();
                console.log('📥 Retry upload response text:', text);
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('❌ Failed to parse response as JSON:', parseError);
                throw new Error('Invalid response from server');
            }

            console.log('📥 Retry upload response data:', data);

            if (!response.ok) {
                console.error('❌ Retry upload failed - Response not OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data,
                });
                throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
            }

            // Handle multiple response formats:
            // 1. { message: "...", receiptUrl: "..." } - direct format from handleSuccessResponse
            // 2. { data: { receiptUrl: "..." } } - nested format
            // 3. { receiptUrl: "..." } - simple format
            const receiptUrl = data.receiptUrl || data.data?.receiptUrl;
            
            console.log('🔍 Retry - Extracted receipt URL:', receiptUrl);
            
            if (!receiptUrl) {
                console.error('❌ Retry upload response missing URL. Full response:', data);
                throw new Error('Upload succeeded but no receipt URL returned');
            }

            setReceiptUrl(receiptUrl);
            toast.success('Receipt uploaded successfully');
            console.log('✅ Retry - Receipt URL set successfully:', receiptUrl);
        } catch (error) {
            console.error('❌ Retry upload error details:', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            toast.error(error instanceof Error ? error.message : 'Failed to upload receipt');
        } finally {
            setIsUploadingReceipt(false);
        }
    };

    const handleProceedToConfirmation = () => {
        if (isPaidEvent) {
            if (!selectedPaymentMethod) {
                toast.error('Please select a payment method');
                return;
            }
            if (!receiptUrl) {
                toast.error('Please upload your payment receipt');
                return;
            }
        }
        setShowPaymentModal(false);
        setShowConfirmation(true);
    };

    const handleConfirmBooking = () => {
        setShowConfirmation(false);
        createBookingMutation.mutate({
            eventSlug,
            paymentMethod: isPaidEvent ? selectedPaymentMethod : undefined,
            receiptUrl: isPaidEvent ? receiptUrl : undefined,
        }, {
            onError: (error) => {
                // Error is handled by the mutation state
            },
        });
    };

    const handleCancelBooking = () => {
        setShowConfirmation(false);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPaymentMethod("");
        setActivePaymentTab('bank');
        setReceiptFile(null);
        setReceiptPreview(null);
        setReceiptUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const paymentMethodGroups = groupPaymentMethods();
    const methodLabels: Record<string, string> = {
        'gcash': 'GCash',
        'bank_transfer': 'Bank Transfer',
        'paymaya': 'PayMaya',
        'grabpay': 'GrabPay',
        'grab_pay': 'GrabPay',
        'qr': 'QR Code',
        'qr_ph': 'QR Code (PH)',
        'qr_gcash': 'QR Code (GCash)',
        'qr_paymaya': 'QR Code (PayMaya)',
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
                            disabled={isLoading || isAdminOrOrganizer}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Booking...
                                </span>
                            ) : (
                                'Book Now'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Payment Method Modal for Paid Events */}
            {mounted && showPaymentModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-md p-6 md:p-8 border border-primary/30 max-w-2xl w-full card-shadow max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 0 20px rgba(89, 222, 202, 0.2), 0 0 40px rgba(89, 222, 202, 0.1)' }}>
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-bold text-light-100 mb-2">Payment Information</h3>
                                <p className="text-light-200 text-sm">Please select a payment method and upload your receipt</p>
                            </div>

                            {/* Event Price */}
                            {event && (
                                <div className="p-4 rounded-md bg-primary/10 border border-primary/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-light-200">Event Price:</span>
                                        <span className="text-primary font-bold text-lg">₱{((event.price || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            )}

                            {/* Payment Methods */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-light-100">Select Payment Method *</label>
                                
                                {/* Tabs */}
                                <div className="flex gap-2 border-b border-border-dark/50">
                                    <button
                                        onClick={() => {
                                            setActivePaymentTab('bank');
                                            const firstMethod = getFirstAvailableMethod('bank');
                                            setSelectedPaymentMethod(firstMethod || "");
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                            activePaymentTab === 'bank'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-light-200 hover:text-light-100'
                                        }`}
                                    >
                                        Bank
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActivePaymentTab('ewallet');
                                            const firstMethod = getFirstAvailableMethod('ewallet');
                                            setSelectedPaymentMethod(firstMethod || "");
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                            activePaymentTab === 'ewallet'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-light-200 hover:text-light-100'
                                        }`}
                                    >
                                        E-Wallet
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActivePaymentTab('qr');
                                            const firstMethod = getFirstAvailableMethod('qr');
                                            setSelectedPaymentMethod(firstMethod || "");
                                        }}
                                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                                            activePaymentTab === 'qr'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-light-200 hover:text-light-100'
                                        }`}
                                    >
                                        QR
                                    </button>
                                </div>

                                {/* Payment Methods by Tab */}
                                <div className="min-h-[120px]">
                                    {activePaymentTab === 'bank' && (
                                        <div>
                                            {paymentMethodGroups.bank.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {paymentMethodGroups.bank.map((method: string) => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setSelectedPaymentMethod(method)}
                                                            className={`p-4 rounded-md border transition-all duration-200 text-left ${
                                                                selectedPaymentMethod === method
                                                                    ? 'bg-primary/20 border-primary text-primary'
                                                                    : 'bg-dark-200/30 border-border-dark/50 text-light-100 hover:border-primary/30'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{methodLabels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-md bg-dark-200/20 border border-border-dark/30 text-center">
                                                    <p className="text-sm text-light-200">Not available</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activePaymentTab === 'ewallet' && (
                                        <div>
                                            {paymentMethodGroups.ewallet.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {paymentMethodGroups.ewallet.map((method: string) => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setSelectedPaymentMethod(method)}
                                                            className={`p-4 rounded-md border transition-all duration-200 ${
                                                                selectedPaymentMethod === method
                                                                    ? 'bg-primary/20 border-primary text-primary'
                                                                    : 'bg-dark-200/30 border-border-dark/50 text-light-100 hover:border-primary/30'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{methodLabels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-md bg-dark-200/20 border border-border-dark/30 text-center">
                                                    <p className="text-sm text-light-200">Not available</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activePaymentTab === 'qr' && (
                                        <div>
                                            {paymentMethodGroups.qr.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {paymentMethodGroups.qr.map((method: string) => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setSelectedPaymentMethod(method)}
                                                            className={`p-4 rounded-md border transition-all duration-200 ${
                                                                selectedPaymentMethod === method
                                                                    ? 'bg-primary/20 border-primary text-primary'
                                                                    : 'bg-dark-200/30 border-border-dark/50 text-light-100 hover:border-primary/30'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{methodLabels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-md bg-dark-200/20 border border-border-dark/30 text-center">
                                                    <p className="text-sm text-light-200">Not available</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            {selectedPaymentMethod && event?.paymentDetails && (
                                <div className="p-4 rounded-md bg-dark-200/30 border border-border-dark/50 space-y-2">
                                    <h4 className="text-sm font-semibold text-light-100 mb-3">Payment Details:</h4>
                                    {selectedPaymentMethod === 'gcash' && event.paymentDetails.gcash && (
                                        <div className="space-y-1 text-sm text-light-200">
                                            <p><span className="font-medium">Name:</span> {event.paymentDetails.gcash.name}</p>
                                            <p><span className="font-medium">Number:</span> {event.paymentDetails.gcash.number}</p>
                                        </div>
                                    )}
                                    {selectedPaymentMethod === 'bank_transfer' && event.paymentDetails.bank && (
                                        <div className="space-y-1 text-sm text-light-200">
                                            <p><span className="font-medium">Bank:</span> {event.paymentDetails.bank.bankName}</p>
                                            <p><span className="font-medium">Account Name:</span> {event.paymentDetails.bank.accountName}</p>
                                            <p><span className="font-medium">Account Number:</span> {event.paymentDetails.bank.accountNumber}</p>
                                        </div>
                                    )}
                                    {selectedPaymentMethod === 'paymaya' && event.paymentDetails.paymaya && (
                                        <div className="space-y-1 text-sm text-light-200">
                                            <p><span className="font-medium">Name:</span> {event.paymentDetails.paymaya.name}</p>
                                            <p><span className="font-medium">Number:</span> {event.paymentDetails.paymaya.number}</p>
                                        </div>
                                    )}
                                    {(selectedPaymentMethod === 'grabpay' || selectedPaymentMethod === 'grab_pay') && event.paymentDetails.grabpay && (
                                        <div className="space-y-1 text-sm text-light-200">
                                            <p><span className="font-medium">Name:</span> {event.paymentDetails.grabpay.name}</p>
                                            <p><span className="font-medium">Number:</span> {event.paymentDetails.grabpay.number}</p>
                                        </div>
                                    )}
                                    {(selectedPaymentMethod === 'qr' || selectedPaymentMethod === 'qr_ph' || selectedPaymentMethod === 'qr_gcash' || selectedPaymentMethod === 'qr_paymaya') && event.paymentDetails.qr && event.paymentDetails.qr.qrCodeUrl && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-light-200">Scan the QR code below:</p>
                                            <Image 
                                                src={event.paymentDetails.qr.qrCodeUrl} 
                                                alt="QR Code" 
                                                width={200} 
                                                height={200} 
                                                className="mx-auto rounded-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Receipt Upload */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-light-100">Upload Payment Receipt *</label>
                                <div className="space-y-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleReceiptChange}
                                        className="hidden"
                                        id="receipt-upload"
                                    />
                                    <label
                                        htmlFor="receipt-upload"
                                        className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-border-dark/50 rounded-md cursor-pointer hover:border-primary/50 transition-colors duration-200 bg-dark-200/20"
                                    >
                                        {receiptPreview ? (
                                            <div className="relative w-full max-w-xs">
                                                <Image
                                                    src={receiptPreview}
                                                    alt="Receipt preview"
                                                    width={400}
                                                    height={300}
                                                    className="w-full h-auto rounded-md object-contain"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setReceiptFile(null);
                                                        setReceiptPreview(null);
                                                        setReceiptUrl("");
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = "";
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-12 h-12 text-light-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-sm text-light-200">Click to upload receipt</p>
                                                <p className="text-xs text-light-200/70 mt-1">PNG, JPG up to 5MB</p>
                                            </>
                                        )}
                                    </label>
                                    {isUploadingReceipt && (
                                        <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                                            <p className="text-sm text-primary flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Uploading receipt...
                                            </p>
                                        </div>
                                    )}
                                    {receiptUrl && !isUploadingReceipt && (
                                        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30">
                                            <p className="text-sm text-green-400 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Receipt uploaded successfully
                                            </p>
                                        </div>
                                    )}
                                    {receiptFile && !receiptUrl && !isUploadingReceipt && (
                                        <div className="space-y-2">
                                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
                                                <p className="text-sm text-red-400 flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Receipt upload failed. Please try again.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleUploadReceipt}
                                                disabled={isUploadingReceipt || !receiptFile || !token}
                                                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Retry Upload
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 24-hour notice */}
                            <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                                <p className="text-sm text-yellow-400 flex items-start gap-2">
                                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Please wait up to 24 hours for email booking confirmation after submitting your payment receipt.</span>
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleClosePaymentModal}
                                    className="flex-1 px-4 py-2.5 rounded-md bg-dark-200/50 border border-border-dark/50 text-light-100 font-medium hover:bg-dark-200/70 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceedToConfirmation}
                                    className="flex-1 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!event?.paymentMethods || event.paymentMethods.length === 0 || !selectedPaymentMethod || !receiptUrl}
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
                                {isPaidEvent 
                                    ? "Your booking will be submitted for payment verification. Please wait up to 24 hours for email confirmation."
                                    : "Are you sure you want to be part of this event?"}
                            </p>
                            {isPaidEvent && (
                                <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 w-full">
                                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Please wait up to 24 hours for email booking confirmation.</span>
                                    </p>
                                </div>
                            )}
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
