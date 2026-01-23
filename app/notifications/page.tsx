"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateToReadable } from "@/lib/formatters";
import Link from "next/link";

export default function NotificationsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [unreadOnly, setUnreadOnly] = useState(false);

    // Fetch notifications
    const { data, isLoading, error } = useQuery({
        queryKey: ["user", "notifications", unreadOnly],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/users/notifications?unreadOnly=${unreadOnly}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch notifications");
            return response.json();
        },
        enabled: !!token,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // API returns notifications and unreadCount at root level (not wrapped in data)
    // Check both root level and data wrapper for compatibility
    const notifications = data?.notifications || data?.data?.notifications || [];
    const unreadCount = data?.unreadCount ?? data?.data?.unreadCount ?? 0;

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationIds?: string[]) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/users/notifications", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notificationIds,
                    markAllAsRead: !notificationIds,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to mark notifications as read");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Notifications marked as read");
            queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to mark notifications as read");
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/users/notifications?notificationId=${notificationId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete notification");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Notification deleted");
            queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete notification");
        },
    });

    // Delete all notifications mutation
    const deleteAllNotificationsMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/users/notifications?deleteAll=true", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete all notifications");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("All notifications deleted");
            queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete all notifications");
        },
    });

    const handleMarkAsRead = (notificationId: string) => {
        markAsReadMutation.mutate([notificationId]);
    };

    const handleMarkAllAsRead = () => {
        markAsReadMutation.mutate(undefined);
    };

    const handleDeleteNotification = (notificationId: string) => {
        if (confirm("Are you sure you want to delete this notification?")) {
            deleteNotificationMutation.mutate(notificationId);
        }
    };

    const handleDeleteAllNotifications = () => {
        if (confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) {
            deleteAllNotificationsMutation.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-foreground/60">Loading notifications...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">Error loading notifications</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground mt-2">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : "All caught up!"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setUnreadOnly(!unreadOnly)}
                    >
                        {unreadOnly ? "Show All" : "Show Unread Only"}
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAllAsRead}
                            disabled={markAsReadMutation.isPending}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark All Read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleDeleteAllNotifications}
                            disabled={deleteAllNotificationsMutation.isPending}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All
                        </Button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="p-12 text-center border rounded-md bg-card">
                    <Bell className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">
                        {unreadOnly ? "No unread notifications" : "No notifications yet"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification: any) => (
                        <div
                            key={notification.id}
                            className={`group relative p-4 border rounded-md bg-card hover:bg-muted/50 transition-colors ${
                                !notification.read ? 'border-primary/20 bg-primary/5' : ''
                            }`}
                        >
                            {/* Delete button - upper right corner */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id)}
                                title="Delete"
                                disabled={deleteNotificationMutation.isPending}
                                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{notification.title}</h3>
                                        {!notification.read && (
                                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateToReadable(notification.createdAt)}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {notification.link && (
                                        <Link href={notification.link} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm" title="View">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

