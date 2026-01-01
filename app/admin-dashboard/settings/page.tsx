import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Admin Dashboard | TechHub",
    description: "Manage platform settings and preferences",
};

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage platform settings and preferences
                </p>
            </div>

            <div className="max-w-2xl">
                <div className="border rounded-lg p-6">
                    <p className="text-muted-foreground">
                        Settings configuration will be implemented here.
                    </p>
                </div>
            </div>
        </div>
    );
}