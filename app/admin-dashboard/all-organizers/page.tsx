import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "All Organizers | Admin Dashboard | TechHub",
    description: "View and manage all event organizers",
};

export default function AllOrganizersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">All Organizers</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all event organizers on the platform
                    </p>
                </div>
                <a
                    href="/admin-dashboard/add-organizers"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Add Organizer
                </a>
            </div>

            <div className="border rounded-lg p-6">
                <p className="text-muted-foreground">
                    Organizers list will be implemented here.
                </p>
            </div>
        </div>
    );
}