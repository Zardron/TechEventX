import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Events | Admin Dashboard | TechHub",
    description: "Add new events to the platform",
};

export default function AddEventsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Add Events</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new event to the platform
                </p>
            </div>

            <div className="max-w-2xl">
                <div className="border rounded-lg p-6">
                    <p className="text-muted-foreground">
                        Event form will be implemented here.
                    </p>
                </div>
            </div>
        </div>
    );
}