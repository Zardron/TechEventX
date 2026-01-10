"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Check, X, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { formatDateToReadable } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

const statusColors = {
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    refunded: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    partially_refunded: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const statusIcons = {
    completed: Check,
    pending: AlertCircle,
    failed: X,
    refunded: X,
    partially_refunded: AlertCircle,
};

export default function PaymentsPage() {
    const { token } = useAuthStore();
    const { isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data, isLoading, error } = useQuery({
        queryKey: ["payments", statusFilter],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            
            const url = statusFilter === "all" 
                ? "/api/users/payments"
                : `/api/users/payments?status=${statusFilter}`;
            
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!response.ok) throw new Error("Failed to fetch payments");
            return response.json();
        },
        enabled: !!token && isAuthenticated,
    });

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.push("/sign-in");
        }
    }, [isAuthenticated, isInitializing, router]);

    const transactions = data?.data?.transactions || [];
    const summary = data?.data?.summary || {
        totalSpent: 0,
        totalRefunded: 0,
        totalTransactions: 0,
    };

    const formatPrice = (cents: number, currency: string = "php") => {
        if (cents === 0) return "Free";
        const symbol = currency.toUpperCase() === "PHP" ? "₱" : "$";
        return `${symbol}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex-center">
                    <div className="text-foreground/60">Loading payment history...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </Link>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Payment History</h1>
                    <p className="text-foreground/60">
                        View all your payment transactions and invoices
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <div className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{formatPrice(summary.totalSpent)}</p>
                    </div>
                    <div className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Refunded</p>
                            <X className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-gray-500">{formatPrice(summary.totalRefunded)}</p>
                    </div>
                    <div className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Transactions</p>
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{summary.totalTransactions}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap mb-6">
                    <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        onClick={() => setStatusFilter("all")}
                        size="sm"
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === "completed" ? "default" : "outline"}
                        onClick={() => setStatusFilter("completed")}
                        size="sm"
                    >
                        Completed
                    </Button>
                    <Button
                        variant={statusFilter === "pending" ? "default" : "outline"}
                        onClick={() => setStatusFilter("pending")}
                        size="sm"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === "refunded" ? "default" : "outline"}
                        onClick={() => setStatusFilter("refunded")}
                        size="sm"
                    >
                        Refunded
                    </Button>
                </div>

                {/* Transactions List */}
                {transactions.length === 0 ? (
                    <div className="flex-center flex-col gap-4 py-20">
                        <CreditCard className="w-16 h-16 text-foreground/20" />
                        <p className="text-foreground/60 text-lg">No transactions found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction: any) => {
                            const StatusIcon = statusIcons[transaction.status as keyof typeof statusIcons] || AlertCircle;
                            return (
                                <div
                                    key={transaction.id}
                                    className="p-6 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {transaction.event && (
                                            <Link
                                                href={`/events/${transaction.event.slug}`}
                                                className="flex items-center gap-4 flex-1 min-w-0"
                                            >
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                                                    <Image
                                                        src={transaction.event.image}
                                                        alt={transaction.event.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg mb-1 truncate">
                                                        {transaction.event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDateToReadable(transaction.event.date)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <CreditCard className="w-4 h-4" />
                                                            {transaction.paymentMethod}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">
                                                    {formatPrice(transaction.amount, transaction.currency)}
                                                </p>
                                                {transaction.discountAmount > 0 && (
                                                    <p className="text-sm text-green-500">
                                                        -{formatPrice(transaction.discountAmount, transaction.currency)} discount
                                                    </p>
                                                )}
                                                {transaction.refundAmount > 0 && (
                                                    <p className="text-sm text-red-500">
                                                        -{formatPrice(transaction.refundAmount, transaction.currency)} refunded
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[transaction.status as keyof typeof statusColors] || statusColors.pending}`}
                                            >
                                                <StatusIcon className="w-3 h-3" />
                                                {transaction.status}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateToReadable(transaction.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

