import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Organizers | Admin Dashboard | TechHub",
    description: "Add new event organizers to the platform",
};

export default function AddOrganizersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Add Organizers</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new event organizer to the platform
                </p>
            </div>

            <div className="max-w-2xl">
                <div className="border rounded-lg p-6">
                    <p className="text-muted-foreground">
                        Organizer form will be implemented here.
                    </p>
                </div>
            </div>
        </div>
    );
}