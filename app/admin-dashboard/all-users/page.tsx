import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "All Users | Admin Dashboard | TechHub",
    description: "View and manage all platform users",
};

export default function AllUsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">All Users</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all users on the platform
                    </p>
                </div>
                <a
                    href="/admin-dashboard/add-users"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Add User
                </a>
            </div>

            <div className="border rounded-lg p-6">
                <p className="text-muted-foreground">
                    Users list will be implemented here.
                </p>
            </div>
        </div>
    );
}