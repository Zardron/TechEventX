"use client";

import { useState } from "react";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from "@/lib/hooks/api/notifications.queries";
import { Bell, X, Check, CheckCheck, FileText, UserPlus, Calendar, CreditCard, AlertCircle, Info, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Format time ago (e.g., "2 hours ago")
function formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Get icon for notification type
function getNotificationIcon(type: string) {
    switch (type) {
        case 'organizer_application_submitted':
        case 'organizer_application_approved':
        case 'organizer_application_rejected':
            return <UserPlus className="w-5 h-5" />;
        case 'user_booking_confirmation':
        case 'user_book_pending':
        case 'organizer_booking_pending':
        case 'event_reminder':
        case 'event_update':
        case 'event_cancelled':
            return <Calendar className="w-5 h-5" />;
        case 'payment_received':
        case 'subscription_expiring':
            return <CreditCard className="w-5 h-5" />;
        case 'system':
            return <Info className="w-5 h-5" />;
        default:
            return <Bell className="w-5 h-5" />;
    }
}

// Get color for notification type
function getNotificationColor(type: string) {
    switch (type) {
        case 'organizer_application_submitted':
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'organizer_application_approved':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'organizer_application_rejected':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'user_booking_confirmation':
            return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'user_book_pending':
        case 'organizer_booking_pending':
            return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'event_reminder':
            return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'event_update':
            return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'event_cancelled':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'payment_received':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'subscription_expiring':
            return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        default:
            return 'bg-primary/10 text-primary border-primary/20';
    }
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: notificationsData } = useNotifications(false);
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();
    const deleteNotificationMutation = useDeleteNotification();

    // API returns notifications and unreadCount at root level (not wrapped in data)
    // Check both root level and data wrapper for compatibility
    const notifications = notificationsData?.notifications || notificationsData?.data?.notifications || [];
    const unreadCount = notificationsData?.unreadCount ?? notificationsData?.data?.unreadCount ?? 0;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="relative cursor-pointer"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-12 w-[420px] bg-card border border-border/50 rounded-md shadow-2xl z-50 max-h-[600px] flex flex-col overflow-hidden backdrop-blur-sm">
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAllAsReadMutation.mutate()}
                                        className="text-xs h-8 px-2 hover:bg-primary/10"
                                    >
                                        <CheckCheck className="w-4 h-4 mr-1" />
                                        Mark all read
                                    </Button>
                                )}
                                
                                    <X className="w-4 h-4 cursor-pointer" onClick={() => setIsOpen(false)} />
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                        <Bell className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No notifications</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {notifications.map((notification: Notification) => (
                                        <div
                                            key={notification.id}
                                            className={`group relative px-4 py-3 hover:bg-muted/50 transition-all cursor-pointer ${
                                                !notification.read 
                                                    ? "bg-primary/5 border-l-4 border-l-primary" 
                                                    : "bg-card"
                                            }`}
                                            onClick={async () => {
                                                if (!notification.read) {
                                                    try {
                                                        await markAsReadMutation.mutateAsync(notification.id);
                                                    } catch (error) {
                                                        console.error("Failed to mark notification as read:", error);
                                                    }
                                                }
                                                setIsOpen(false);
                                                if (notification.link) {
                                                    window.open(notification.link, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                        >
                                            {/* Delete button - upper right corner */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Are you sure you want to delete this notification?")) {
                                                        deleteNotificationMutation.mutate(notification.id);
                                                    }
                                                }}
                                                className="absolute text-red-400 top-2.5 right-2.5 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-full cursor-pointer"
                                                disabled={deleteNotificationMutation.isPending}
                                                title="Delete"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center border ${
                                                    getNotificationColor(notification.type)
                                                }`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className={`font-semibold text-sm leading-tight ${
                                                            !notification.read ? "text-foreground" : "text-muted-foreground"
                                                        }`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5 mr-[2px] animate-pulse group-hover:hidden" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    {notification.type === 'organizer_application_approved' && !notification.read && (
                                                        <div className="mt-2 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-md">
                                                            <div className="flex items-start gap-2">
                                                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">
                                                                        Please sign out and sign back in
                                                                    </p>
                                                                    <p className="text-xs text-foreground/70">
                                                                        Your organizer role will be active after relogin
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-muted-foreground/70">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </p>
                                                        {!notification.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsReadMutation.mutate(notification.id);
                                                                }}
                                                                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                                                            >
                                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                                Mark read
                                                            </Button>
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
                </>
            )}
        </div>
    );
}


