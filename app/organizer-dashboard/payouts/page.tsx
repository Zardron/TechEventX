"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { DollarSign, TrendingUp, CreditCard, Clock, Check, X, AlertCircle, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateToReadable } from "@/lib/formatters";

export default function PaymentsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        paymentMethod: "bank_transfer",
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        paypalEmail: "",
    });

    // Fetch payment data
    const { data, isLoading, error } = useQuery({
        queryKey: ["organizer", "payments"],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/organizer/payments", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch payment data");
            return response.json();
        },
        enabled: !!token,
    });

    const payoutData = data?.data || {
        availableBalance: 0,
        totalEarned: 0,
        totalPaid: 0,
        pendingBalance: 0,
        payouts: [],
        unpaidTransactionCount: 0,
    };

    // Request payment mutation
    const requestPaymentMutation = useMutation({
        mutationFn: async (paymentData: any) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/organizer/payments", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to request payment");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Payment request submitted successfully");
            queryClient.invalidateQueries({ queryKey: ["organizer", "payments"] });
            setShowRequestForm(false);
            setFormData({
                amount: "",
                paymentMethod: "bank_transfer",
                bankName: "",
                accountNumber: "",
                accountHolderName: "",
                paypalEmail: "",
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to request payment");
        },
    });

    const formatPrice = (cents: number) => {
        return `₱${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const accountDetails: any = {};
        
        if (formData.paymentMethod === "bank_transfer") {
            accountDetails.bankName = formData.bankName;
            accountDetails.accountNumber = formData.accountNumber;
            accountDetails.accountHolderName = formData.accountHolderName;
        } else if (formData.paymentMethod === "paypal") {
            accountDetails.paypalEmail = formData.paypalEmail;
        }

        requestPaymentMutation.mutate({
            amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
            paymentMethod: formData.paymentMethod,
            accountDetails,
        });
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
                        <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-muted rounded w-36 animate-pulse"></div>
                </div>

                {/* Balance Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-6 border rounded-md bg-card animate-pulse">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-4 bg-muted rounded w-32"></div>
                                <div className="w-4 h-4 bg-muted rounded"></div>
                            </div>
                            <div className="h-8 bg-muted rounded w-24 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-28"></div>
                        </div>
                    ))}
                </div>

                {/* Payment History Skeleton */}
                <div className="border rounded-md bg-card overflow-hidden animate-pulse">
                    <div className="p-6 border-b">
                        <div className="h-6 bg-muted rounded w-40"></div>
                    </div>
                    <div className="divide-y">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 bg-muted rounded w-32"></div>
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">Error loading payment data</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground mt-2">
                        Request payments for your event revenue
                    </p>
                </div>
                <Button
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    disabled={payoutData.availableBalance < 1000}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Payment
                </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{formatPrice(payoutData.availableBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ready for payment</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(payoutData.totalEarned)}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time revenue</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(payoutData.totalPaid)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Paid out</p>
                </div>
                <div className="p-6 border rounded-md bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{formatPrice(payoutData.pendingBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-1">In processing</p>
                </div>
            </div>

            {/* Request Form */}
            {showRequestForm && (
                <div className="p-6 border rounded-md bg-card">
                    <h2 className="text-xl font-semibold mb-4">Request Payment</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormInput
                            label="Amount (PHP)"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                            placeholder={`Max: ${formatPrice(payoutData.availableBalance)}`}
                            helperText={`Available: ${formatPrice(payoutData.availableBalance)} | Minimum: ₱10.00`}
                        />
                        <FormSelect
                            label="Payment Method"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            options={[
                                { value: "bank_transfer", label: "Bank Transfer" },
                                { value: "paypal", label: "PayPal" },
                            ]}
                            required
                        />
                        {formData.paymentMethod === "bank_transfer" && (
                            <>
                                <FormInput
                                    label="Bank Name"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Account Number"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Account Holder Name"
                                    value={formData.accountHolderName}
                                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                    required
                                />
                            </>
                        )}
                        {formData.paymentMethod === "paypal" && (
                            <FormInput
                                label="PayPal Email"
                                type="email"
                                value={formData.paypalEmail}
                                onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                                required
                            />
                        )}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={requestPaymentMutation.isPending}>
                                {requestPaymentMutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowRequestForm(false);
                                    setFormData({
                                        amount: "",
                                        paymentMethod: "bank_transfer",
                                        bankName: "",
                                        accountNumber: "",
                                        accountHolderName: "",
                                        paypalEmail: "",
                                    });
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Payment History */}
            <div className="border rounded-md bg-card overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Payment History</h2>
                </div>
                {payoutData.payouts.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground">No payment requests yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {payoutData.payouts.map((payout: any) => (
                            <div key={payout.id} className="p-6 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="text-2xl font-bold">{formatPrice(payout.amount)}</p>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[payout.status as keyof typeof statusColors] || statusColors.pending}`}
                                            >
                                                {payout.status}
                                            </span>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
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
                                            {payout.failureReason && (
                                                <div>
                                                    <p className="text-muted-foreground">Failure Reason</p>
                                                    <p className="font-semibold text-red-500">{payout.failureReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

