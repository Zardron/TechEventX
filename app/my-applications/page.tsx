"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, ExternalLink, LogOut, AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDateToReadable } from "@/lib/formatters";

export default function MyApplicationsPage() {
    const { user, isAuthenticated, isInitializing, clearAuth } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoadingApplications, setIsLoadingApplications] = useState(true);

    const fetchApplications = async () => {
        try {
            const { useAuthStore } = await import("@/lib/store/auth.store");
            const { token } = useAuthStore.getState();
            
            if (!token) return;

            const response = await fetch("/api/organizer-applications", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setApplications(data.data?.applications || []);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
            toast.error("Failed to load applications");
        } finally {
            setIsLoadingApplications(false);
        }
    };

    useEffect(() => {
        if (!isInitializing) {
            if (!isAuthenticated) {
                router.push("/sign-in");
                return;
            }
            fetchApplications();
        }
    }, [isAuthenticated, isInitializing, router]);

    if (isInitializing || isLoadingApplications) {
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
                    <h1 className="text-4xl font-bold text-foreground mb-2">My Organizer Applications</h1>
                    <p className="text-foreground/60">
                        View and track the status of your organizer applications
                    </p>
                </div>

                {applications.length === 0 ? (
                    <div className="p-6 border rounded-md bg-card">
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-foreground/60 mb-4">
                                You haven't submitted an organizer application yet.
                            </p>
                            <Link href="/become-organizer">
                                <Button>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Apply to Become an Organizer
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {applications.map((application) => (
                            <div
                                key={application.id}
                                className="p-6 border rounded-md bg-card"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-semibold">
                                                {application.organizerName}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 text-sm rounded-full font-medium ${
                                                    application.status === 'pending'
                                                        ? 'bg-yellow-500/20 text-yellow-500'
                                                        : application.status === 'approved'
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-red-500/20 text-red-500'
                                                }`}
                                            >
                                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                            </span>
                                        </div>
                                        {application.companyName && (
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Company: {application.companyName}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Applied: {formatDateToReadable(
                                                application.createdAt && typeof application.createdAt === 'object' && 'toISOString' in application.createdAt
                                                    ? (application.createdAt as Date).toISOString()
                                                    : String(application.createdAt)
                                            )}
                                        </p>
                                        {application.description && (
                                            <p className="text-sm text-foreground/80 mt-3 mb-4">
                                                {application.description}
                                            </p>
                                        )}

                                        {application.status === 'pending' && (
                                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-500 mb-1">
                                                            Application Under Review
                                                        </p>
                                                        <p className="text-xs text-foreground/80">
                                                            Your application is being reviewed by our team. We'll notify you once a decision has been made.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {application.status === 'approved' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-md shadow-lg">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/40">
                                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-base font-bold text-green-500 mb-1">
                                                                🎉 Your application has been approved!
                                                            </p>
                                                            <p className="text-sm text-foreground/90 mb-3">
                                                                You've been automatically assigned the Free plan. Your organizer account is now active!
                                                            </p>
                                                            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-md mb-3">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
                                                                            Action Required: Please Sign Out and Sign Back In
                                                                        </p>
                                                                        <p className="text-xs text-foreground/80">
                                                                            To access your organizer dashboard and all organizer features, please sign out and sign back in. This will refresh your account permissions and reflect your new organizer role.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    onClick={() => {
                                                                        clearAuth();
                                                                        router.push('/sign-in');
                                                                    }}
                                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                                >
                                                                    <LogOut className="w-4 h-4 mr-2" />
                                                                    Sign Out & Sign In
                                                                </Button>
                                                                <Link href="/organizer-dashboard">
                                                                    <Button size="sm" variant="outline">
                                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                                        Try Dashboard (after relogin)
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {application.status === 'rejected' && application.rejectionReason && (
                                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                                                <div className="flex items-start gap-3">
                                                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-red-500 mb-1">
                                                            Application Rejected
                                                        </p>
                                                        <p className="text-sm text-foreground/80 mb-2">
                                                            <strong>Reason:</strong> {application.rejectionReason}
                                                        </p>
                                                        <Link href="/become-organizer">
                                                            <Button size="sm" variant="outline" className="mt-2">
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                Submit New Application
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        {application.status === 'pending' && (
                                            <Clock className="w-8 h-8 text-yellow-500" />
                                        )}
                                        {application.status === 'approved' && (
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        )}
                                        {application.status === 'rejected' && (
                                            <XCircle className="w-8 h-8 text-red-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {applications.every((app) => app.status !== 'pending') && (
                            <div className="p-6 border rounded-md bg-card text-center">
                                <Link href="/become-organizer">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Submit New Application
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

