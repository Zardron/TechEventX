import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard | TechHub",
    description: "Manage users, organizers, events, and platform settings",
};

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome to the admin dashboard. Manage your platform from here.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Users"
                    description="Manage platform users"
                    href="/admin-dashboard/all-users"
                />
                <DashboardCard
                    title="Organizers"
                    description="Manage event organizers"
                    href="/admin-dashboard/all-organizers"
                />
                <DashboardCard
                    title="Events"
                    description="Manage events"
                    href="/admin-dashboard/all-events"
                />
            </div>
        </div>
    );
}

function DashboardCard({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="block p-6 border rounded-lg hover:bg-accent transition-colors"
        >
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </a>
    );
}