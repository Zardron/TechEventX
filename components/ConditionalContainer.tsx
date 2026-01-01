"use client";

import { usePathname } from "next/navigation";

export default function ConditionalContainer({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminDashboard = pathname.startsWith("/admin-dashboard");

    if (isAdminDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="container mx-auto px-10 py-10 pt-16 relative z-10">
            {children}
        </div>
    );
}

