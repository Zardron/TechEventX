"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
    const pathname = usePathname();
    const hideFooter = pathname === "/sign-up" || pathname === "/sign-in" || pathname === "/admin-dashboard";

    if (hideFooter) {
        return null;
    }

    return (
        <div className="container mx-auto px-10 relative z-10">
            <Footer />
        </div>
    );
}

