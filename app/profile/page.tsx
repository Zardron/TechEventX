"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";
import { Save, User, Lock, ArrowLeft, Bell } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function PasswordChangeForm() {
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChanging, setIsChanging] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsChanging(true);

        try {
            const { useAuthStore } = await import("@/lib/store/auth.store");
            const { token } = useAuthStore.getState();
            
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to change password");
            }

            toast.success("Password changed successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <form onSubmit={handlePasswordChange} className="space-y-4">
            <FormInput
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
            />
            <FormInput
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                helperText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
            />
            <FormInput
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
            />
            <Button type="submit" disabled={isChanging}>
                <Lock className="w-4 h-4 mr-2" />
                {isChanging ? "Changing..." : "Change Password"}
            </Button>
        </form>
    );
}

export default function ProfilePage() {
    const { user, isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });
    const [notificationPrefs, setNotificationPrefs] = useState({
        emailBookingConfirmations: true,
        emailEventReminders: true,
        emailEventUpdates: true,
        emailPromotions: true,
        emailNewsletter: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { useAuthStore } = await import("@/lib/store/auth.store");
            const { token } = useAuthStore.getState();
            
            if (!token) return;

            const response = await fetch("/api/users/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user?.notificationPreferences) {
                    setNotificationPrefs(data.user.notificationPreferences);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (!isInitializing) {
            if (!isAuthenticated) {
                router.push("/sign-in");
                return;
            }
            if (user) {
                setFormData({
                    name: user.name || "",
                    email: user.email || "",
                });
                fetchProfile();
            }
        }
    }, [isAuthenticated, isInitializing, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { useAuthStore } = await import("@/lib/store/auth.store");
            const { token } = useAuthStore.getState();
            
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    name: formData.name,
                    notificationPreferences: notificationPrefs,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");
            // Refresh user data
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen bg-background pt-20 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex-center">
                    <div className="text-foreground/60">Loading...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </Link>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">My Profile</h1>
                    <p className="text-foreground/60">
                        Manage your account information and security settings
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Settings */}
                    <div className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Profile Information</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FormInput
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <FormInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled
                                helperText="Email cannot be changed"
                            />

                            <Button type="submit" disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </div>

                    {/* Security Settings */}
                    <div className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Security</h2>
                        </div>

                        <PasswordChangeForm />
                    </div>

                    {/* Notification Preferences */}
                    <div className="p-6 border rounded-lg bg-card md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Email Notifications</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="font-medium">Booking Confirmations</p>
                                    <p className="text-sm text-muted-foreground">Receive emails when you book events</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.emailBookingConfirmations}
                                    onChange={(e) => setNotificationPrefs({
                                        ...notificationPrefs,
                                        emailBookingConfirmations: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="font-medium">Event Reminders</p>
                                    <p className="text-sm text-muted-foreground">Receive reminders before events</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.emailEventReminders}
                                    onChange={(e) => setNotificationPrefs({
                                        ...notificationPrefs,
                                        emailEventReminders: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="font-medium">Event Updates</p>
                                    <p className="text-sm text-muted-foreground">Receive updates about events you're attending</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.emailEventUpdates}
                                    onChange={(e) => setNotificationPrefs({
                                        ...notificationPrefs,
                                        emailEventUpdates: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="font-medium">Promotions</p>
                                    <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.emailPromotions}
                                    onChange={(e) => setNotificationPrefs({
                                        ...notificationPrefs,
                                        emailPromotions: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="font-medium">Newsletter</p>
                                    <p className="text-sm text-muted-foreground">Receive our newsletter with event highlights</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.emailNewsletter}
                                    onChange={(e) => setNotificationPrefs({
                                        ...notificationPrefs,
                                        emailNewsletter: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                            </label>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="mt-4"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Preferences"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

