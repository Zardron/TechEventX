"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { FormInput } from "@/components/ui/form-input";
import { DollarSign, Clock, Check, X, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateToReadable } from "@/lib/formatters";

export default function AdminPaymentsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
    const [failureReason, setFailureReason] = useState("");

    // Fetch payments
    const { data, isLoading, error } = useQuery({
        queryKey: ["admin", "payments", statusFilter],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const url = statusFilter 
                ? `/api/admin/payments?status=${statusFilter}`
                : "/api/admin/payments";
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch payments");
            return response.json();
        },
        enabled: !!token,
    });

    const payouts = data?.data?.payouts || [];
    const stats = data?.data?.stats || {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalPendingAmount: 0,
        totalCompletedAmount: 0,
    };

    // Update payment status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ payoutId, status, failureReason }: { payoutId: string; status: string; failureReason?: string }) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/admin/payments/${payoutId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status, failureReason }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update payment status");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Payment status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
            setSelectedPayout(null);
            setFailureReason("");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update payment status");
        },
    });

    const formatPrice = (cents: number, currency: string = "php") => {
        const symbol = currency.toUpperCase() === "PHP" ? "₱" : "$";
        return `${symbol}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleStatusUpdate = (payoutId: string, status: string) => {
        if (status === 'failed' && !failureReason) {
            setSelectedPayout(payoutId);
            return;
        }
        updateStatusMutation.mutate({ payoutId, status, failureReason: failureReason || undefined });
    };

    const statusColors = {
        pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        completed: "bg-green-500/10 text-green-500 border-green-500/20",
        failed: "bg-red-500/10 text-red-500 border-red-500/20",
        cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
                </div>

                {/* Statistics Skeleton */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-4 bg-muted rounded w-24"></div>
                                <div className="w-4 h-4 bg-muted rounded"></div>
                            </div>
                            <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                    ))}
                </div>

                {/* Payments List Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-muted rounded w-32"></div>
                                        <div className="h-6 bg-muted rounded w-24"></div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[...Array(4)].map((_, j) => (
                                            <div key={j}>
                                                <div className="h-3 bg-muted rounded w-20 mb-2"></div>
                                                <div className="h-4 bg-muted rounded w-32"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-4 flex flex-col gap-2">
                                    <div className="h-9 bg-muted rounded w-32"></div>
                                    <div className="h-9 bg-muted rounded w-24"></div>
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
                <div className="text-red-500">Error loading payments</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payment Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Process organizer payment requests
                    </p>
                </div>
                <FormSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                        { value: "", label: "All Statuses" },
                        { value: "pending", label: "Pending" },
                        { value: "processing", label: "Processing" },
                        { value: "completed", label: "Completed" },
                        { value: "failed", label: "Failed" },
                    ]}
                    className="w-48"
                />
            </div>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <Clock className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPrice(stats.totalPendingAmount)}</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Processing</p>
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.processing}</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPrice(stats.totalCompletedAmount)}</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <X className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
            </div>

            {/* Payments List */}
            {payouts.length === 0 ? (
                <div className="p-12 text-center border rounded-md bg-card">
                    <DollarSign className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No payment requests found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {payouts.map((payout: any) => (
                        <div
                            key={payout.id}
                            className="p-6 border rounded-md bg-card"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{formatPrice(payout.amount, payout.currency)}</h3>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[payout.status as keyof typeof statusColors] || statusColors.pending}`}
                                        >
                                            {payout.status}
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                                        <div>
                                            <p className="text-muted-foreground">Organizer</p>
                                            <p className="font-semibold">{payout.organizer?.name}</p>
                                            <p className="text-muted-foreground text-xs">{payout.organizer?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Payment Method</p>
                                            <p className="font-semibold capitalize">{payout.paymentMethod.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Requested</p>
                                            <p className="font-semibold">{formatDateToReadable(payout.requestedAt)}</p>
                                        </div>
                                        {payout.processedAt && (
                                            <div>
                                                <p className="text-muted-foreground">Processed</p>
                                                <p className="font-semibold">{formatDateToReadable(payout.processedAt)}</p>
                                            </div>
                                        )}
                                        {payout.accountDetails && (
                                            <div className="md:col-span-2">
                                                <p className="text-muted-foreground">Account Details</p>
                                                <div className="mt-1 space-y-1">
                                                    {payout.accountDetails.bankName && (
                                                        <p className="text-sm">Bank: {payout.accountDetails.bankName}</p>
                                                    )}
                                                    {payout.accountDetails.accountNumber && (
                                                        <p className="text-sm">Account: {payout.accountDetails.accountNumber}</p>
                                                    )}
                                                    {payout.accountDetails.accountHolderName && (
                                                        <p className="text-sm">Holder: {payout.accountDetails.accountHolderName}</p>
                                                    )}
                                                    {payout.accountDetails.paypalEmail && (
                                                        <p className="text-sm">PayPal: {payout.accountDetails.paypalEmail}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {payout.failureReason && (
                                            <div className="md:col-span-2">
                                                <p className="text-muted-foreground">Failure Reason</p>
                                                <p className="font-semibold text-red-500">{payout.failureReason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedPayout === payout.id && (
                                        <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-4">
                                            <FormInput
                                                label="Failure Reason"
                                                value={failureReason}
                                                onChange={(e) => setFailureReason(e.target.value)}
                                                placeholder="Reason for failure"
                                                required
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleStatusUpdate(payout.id, 'failed')}
                                                    disabled={updateStatusMutation.isPending || !failureReason}
                                                    variant="destructive"
                                                >
                                                    Mark as Failed
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedPayout(null);
                                                        setFailureReason("");
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {payout.status === 'pending' && (
                                    <div className="ml-4 flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleStatusUpdate(payout.id, 'processing')}
                                            disabled={updateStatusMutation.isPending}
                                            size="sm"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Start Processing
                                        </Button>
                                        <Button
                                            onClick={() => handleStatusUpdate(payout.id, 'cancelled')}
                                            disabled={updateStatusMutation.isPending}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                                {payout.status === 'processing' && (
                                    <div className="ml-4 flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleStatusUpdate(payout.id, 'completed')}
                                            disabled={updateStatusMutation.isPending}
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Mark Complete
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedPayout(payout.id);
                                            }}
                                            disabled={updateStatusMutation.isPending}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Mark Failed
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

