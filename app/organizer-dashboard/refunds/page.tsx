"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { DollarSign, RefreshCw, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateToReadable } from "@/lib/formatters";

export default function RefundsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [reason, setReason] = useState("");

    // Fetch refund requests
    const { data, isLoading, error } = useQuery({
        queryKey: ["organizer", "refunds"],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/organizer/refunds", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch refund requests");
            return response.json();
        },
        enabled: !!token,
    });

    const refundRequests = data?.data?.refundRequests || [];

    // Process refund mutation
    const processRefundMutation = useMutation({
        mutationFn: async ({ transactionId, refundAmount, reason }: { transactionId: string; refundAmount?: number; reason?: string }) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/organizer/refunds", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ transactionId, refundAmount, reason }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to process refund");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Refund processed successfully");
            queryClient.invalidateQueries({ queryKey: ["organizer", "refunds"] });
            setSelectedTransaction(null);
            setRefundAmount("");
            setReason("");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to process refund");
        },
    });

    const formatPrice = (cents: number, currency: string = "php") => {
        if (cents === 0) return "Free";
        const symbol = currency.toUpperCase() === "PHP" ? "₱" : "$";
        return `${symbol}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleRefund = (transaction: any) => {
        setSelectedTransaction(transaction.id);
        setRefundAmount((transaction.amount / 100).toString());
    };

    const handleSubmitRefund = (transactionId: string) => {
        const amount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
        processRefundMutation.mutate({
            transactionId,
            refundAmount: amount,
            reason: reason || undefined,
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
                </div>

                {/* Refund Request Cards Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded w-48"></div>
                                        <div className="h-6 bg-muted rounded w-24"></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[...Array(4)].map((_, j) => (
                                            <div key={j}>
                                                <div className="h-3 bg-muted rounded w-24 mb-2"></div>
                                                <div className="h-4 bg-muted rounded w-32"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="h-10 bg-muted rounded w-32"></div>
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">Error loading refund requests</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Refund Management</h1>
                <p className="text-muted-foreground mt-2">
                    Process refunds for event bookings
                </p>
            </div>

            {refundRequests.length === 0 ? (
                <div className="p-12 text-center border rounded-md bg-card">
                    <RefreshCw className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No refund requests at this time</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {refundRequests.map((request: any) => (
                        <div
                            key={request.id}
                            className="p-6 border rounded-md bg-card"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{request.event?.title || 'Unknown Event'}</h3>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                request.status === "completed"
                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                            }`}
                                        >
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                                        <div>
                                            <p className="text-muted-foreground">Customer</p>
                                            <p className="font-semibold">{request.user?.name || 'Unknown'}</p>
                                            <p className="text-muted-foreground text-xs">{request.user?.email || ''}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Event Date</p>
                                            <p className="font-semibold">{request.event?.date ? formatDateToReadable(request.event.date) : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Transaction Amount</p>
                                            <p className="font-semibold text-lg">{formatPrice(request.amount, request.currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Transaction Date</p>
                                            <p className="font-semibold">{formatDateToReadable(request.createdAt)}</p>
                                        </div>
                                    </div>

                                    {selectedTransaction === request.id && (
                                        <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-4">
                                            <FormInput
                                                label="Refund Amount"
                                                type="number"
                                                step="0.01"
                                                value={refundAmount}
                                                onChange={(e) => setRefundAmount(e.target.value)}
                                                placeholder={`Max: ${formatPrice(request.amount, request.currency)}`}
                                                helperText={`Maximum refund: ${formatPrice(request.amount, request.currency)}`}
                                            />
                                            <FormInput
                                                label="Reason (Optional)"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Reason for refund"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleSubmitRefund(request.id)}
                                                    disabled={processRefundMutation.isPending}
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    {processRefundMutation.isPending ? "Processing..." : "Process Refund"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedTransaction(null);
                                                        setRefundAmount("");
                                                        setReason("");
                                                    }}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedTransaction !== request.id && request.status === "completed" && (
                                    <Button
                                        onClick={() => handleRefund(request)}
                                        className="ml-4"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Process Refund
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

