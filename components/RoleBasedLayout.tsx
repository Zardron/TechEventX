"use client";

import { useAuth } from "@/lib/hooks/use-auth";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            {children}
        </div>
    );
};

const RoleBasedLayout = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    return (
        <div>
            {user?.role === 'admin' ? <AdminLayout>{children}</AdminLayout> : <UserLayout>{children}</UserLayout>}
        </div>
    );
};

export default RoleBasedLayout;

