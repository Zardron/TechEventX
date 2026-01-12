"use client";

import SideBar from "@/components/organizer-dashboard/Sidebar";
import Navbar from "@/components/organizer-dashboard/Navbar";
import BreadCrumbs from "@/components/organizer-dashboard/BreadCrumbs";
import Footer from "@/components/organizer-dashboard/Footer";
import WelcomeGuide from "@/components/organizer-dashboard/WelcomeGuide";
import { useAuth } from "@/lib/hooks/use-auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganizerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user, isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // On mobile, sidebar should be collapsed by default
            if (window.innerWidth < 768) {
                setSideBarCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        // Wait for auth initialization to complete before redirecting
        if (!isInitializing) {
            if (!isAuthenticated) {
                router.push("/sign-in");
            } else if (user?.role !== "organizer" && user?.role !== "admin") {
                router.push("/");
            }
        }
    }, [user, isAuthenticated, isInitializing, router]);

    // Show loading state while initializing auth
    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated || (user?.role !== "organizer" && user?.role !== "admin")) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Redirecting...</div>
            </div>
        );
    }

    return (
        <div className="flex">
            {/* Sidebar - hidden on mobile when collapsed, shown as overlay when open */}
            <div
                className={`
                    fixed left-0 top-0 h-screen z-40 transition-all duration-300
                    ${sideBarCollapsed 
                        ? "w-0 -translate-x-full md:translate-x-0" 
                        : "w-64 translate-x-0"
                    }
                    ${isMobile && !sideBarCollapsed ? "shadow-2xl" : ""}
                `}
            >
                <SideBar />
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && !sideBarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSideBarCollapsed(true)}
                />
            )}

            {/* Main content area */}
            <div className={`
                flex-1 transition-all duration-300 w-full
                ${sideBarCollapsed || isMobile ? "ml-0" : "ml-0 md:ml-64"}
            `}>
                <div className={`
                    fixed top-0 z-50 transition-all duration-300
                    ${sideBarCollapsed || isMobile 
                        ? "left-0 right-0 w-full" 
                        : "left-64 right-0 md:w-[calc(100%-16rem)]"}
                `}>
                    <Navbar
                        sideBarCollapsed={sideBarCollapsed}
                        setSideBarCollapsed={setSideBarCollapsed}
                    />
                </div>
                <div className="p-10 sm:p-4 pt-24 sm:pt-20">
                    <BreadCrumbs />
                    <div className="my-4">{children}</div>
                    <Footer />
                </div>
            </div>
            <WelcomeGuide />
        </div>
    );
}

