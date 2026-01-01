"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { usePathname } from "next/navigation";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
};

const RoleBasedLayout = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin-dashboard");

    // Admin routes have their own layout.tsx, so we don't need to wrap them here
    // Just return children for admin routes, and apply UserLayout for others
    if (isAdminRoute) {
        // Admin dashboard has its own layout.tsx that handles the admin UI
        return <>{children}</>;
    }

    return <UserLayout>{children}</UserLayout>;
};

export default RoleBasedLayout;

