"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    const hideNavbar = pathname.startsWith("/admin-dashboard");

    if (hideNavbar) {
        return null;
    }

    return (
        <Navbar />
    );
}

