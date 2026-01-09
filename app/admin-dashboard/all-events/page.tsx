"use client";

import { PlusIcon, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useEvents } from "@/lib/hooks/api/events.queries";
import { DataTable, type Column } from "@/components/DataTable";
import { IEvent } from "@/database/event.model";
import { Button } from "@/components/ui/button";
import { formatDateToReadable } from "@/lib/utils";
import { formatDateTo12Hour } from "@/lib/formatters";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AllEventsPage() {
    const { data, isLoading, error, isError } = useEvents();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

    const events = data?.events || [];

    const handleDelete = (event: IEvent) => {
        setSelectedEvent(event);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedEvent) return;

        const deletePromise = fetch(`/api/events/${selectedEvent.slug}`, {
            method: 'DELETE',
        }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete event');
            }
            setDeleteDialogOpen(false);
            setSelectedEvent(null);
            // Refetch events
            queryClient.invalidateQueries({ queryKey: ['events'] });
            return data;
        });

        toast.promise(deletePromise, {
            loading: 'Deleting event...',
            success: `Event "${selectedEvent.title}" has been deleted.`,
            error: (error) => error instanceof Error ? error.message : "An error occurred while deleting the event.",
        });
    };

    const columns: Column<IEvent>[] = [
        {
            key: "title",
            header: "Title",
            render: (value: string, row: IEvent) => {
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">{value}</span>
                        <span className="text-xs text-muted-foreground">Slug: {row.slug}</span>
                    </div>
                );
            },
        },
        {
            key: "organizer",
            header: "Organizer",
        },
        {
            key: "date",
            header: "Date",
            render: (value: string) => {
                if (!value) return "-";
                return formatDateToReadable(value);
            },
        },
        {
            key: "time",
            header: "Time",
            render: (value: string) => {
                if (!value) return "-";
                return formatDateTo12Hour(value);
            },
        },
        {
            key: "mode",
            header: "Mode",
            render: (value: string) => {
                const modeColors: Record<string, string> = {
                    Virtual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    Onsite: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    Hybrid: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                };
                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modeColors[value] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                    >
                        {value}
                    </span>
                );
            },
        },
        {
            key: "location",
            header: "Location",
        },
        {
            key: "createdAt",
            header: "Created At",
            render: (value: Date) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">All Events</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all events on the platform
                    </p>
                </div>
                <Link
                    href="/admin-dashboard/add-events"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add Event
                </Link>
            </div>

            <div className="border rounded-lg p-6">
                <DataTable
                    data={events}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search by title, organizer, or location..."
                    searchKeys={["title", "organizer", "location"]}
                    filters={[
                        {
                            key: "mode",
                            label: "Mode",
                            options: [
                                { value: "Virtual", label: "Virtual" },
                                { value: "Onsite", label: "Onsite" },
                                { value: "Hybrid", label: "Hybrid" },
                            ],
                        },
                    ]}
                    loading={isLoading}
                    emptyMessage="No events found"
                    actions={(row: IEvent) => {
                        return (
                            <div className="flex items-center gap-2">
                                <Link href={`/events/${row.slug}`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(row)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        );
                    }}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedEvent?.title}</strong>? This action cannot be undone and will permanently remove the event.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
