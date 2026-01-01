import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Users | Admin Dashboard | TechHub",
    description: "Add new users to the platform",
};

export default function AddUsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Add Users</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new user to the platform
                </p>
            </div>

            <div className="max-w-2xl">
                <div className="border rounded-lg p-6">
                    <p className="text-muted-foreground">
                        User form will be implemented here.
                    </p>
                </div>
            </div>
        </div>
    );
}