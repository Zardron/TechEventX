"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, Ticket, DollarSign, Clock, Plus, TrendingUp, Download, Filter, ArrowUp } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useOrganizerStats, useOrganizerEvents, useCurrentOrganizer } from "@/lib/hooks/api/organizer.queries";
import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

type TimeRange = '7days' | '30days' | '90days' | 'month' | 'year' | 'all' | 'custom';

export default function OrganizerDashboardPage() {
    const { token } = useAuthStore();
    const [timeRange, setTimeRange] = useState<TimeRange>('7days');
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    });
    const { data: organizerData } = useCurrentOrganizer();

    // Calculate date range based on selected time range
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        let start = new Date(0); // All time default
        let end = new Date();

        if (timeRange === 'custom' && dateRange.startDate && dateRange.endDate) {
            start = new Date(dateRange.startDate);
            end = new Date(dateRange.endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            switch (timeRange) {
                case '7days':
                    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90days':
                    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    start = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'all':
                default:
                    start = new Date(0);
                    break;
            }
        }

        return { startDate: start, endDate: end };
    }, [timeRange, dateRange]);

    const { data: stats, isLoading, error } = useOrganizerStats();
    const { data: eventsData } = useOrganizerEvents();
    
    // Fetch plans
    const { data: plansData } = useQuery({
        queryKey: ["plans"],
        queryFn: async () => {
            const response = await fetch("/api/plans");
            if (!response.ok) throw new Error("Failed to fetch plans");
            return response.json();
        },
    });

    // Fetch current subscription
    const { data: subscriptionData } = useQuery({
        queryKey: ["subscription"],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/subscriptions", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch subscription");
            return response.json();
        },
        enabled: !!token,
    });

    // Fix: handleSuccessResponse spreads the data object, so plans are directly in plansData.plans
    const plans = plansData?.plans || plansData?.data?.plans || [];
    const subscription = subscriptionData?.subscription || subscriptionData?.data?.subscription;
    const currentPlan = subscription?.plan;

    // Determine if plan is upgradable
    const isUpgradable = useMemo(() => {
        if (!currentPlan || !plans.length) return false;
        const currentPrice = currentPlan.price || 0;
        // Check if there are any plans with higher price
        return plans.some((plan: any) => plan.price > currentPrice && plan.isActive);
    }, [currentPlan, plans]);
    
    // Fetch analytics with date range
    const { data: analyticsData } = useQuery({
        queryKey: ["organizer", "analytics", startDate.toISOString(), endDate.toISOString()],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const url = timeRange !== 'all'
                ? `/api/organizer/analytics?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
                : "/api/organizer/analytics";
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch analytics");
            return response.json();
        },
        enabled: !!token,
    });

    // Get organizer name (fallback to 'Organizer' if not loaded yet)
    const organizerName = organizerData?.data?.organizer?.name || organizerData?.organizer?.name || 'Organizer';

    // Filter data based on date range
    const filteredData = useMemo(() => {
        // handleSuccessResponse spreads the data object, so stats are at root level
        // Also support nested structure for backward compatibility
        const statsData = stats?.data || {
            totalEvents: stats?.totalEvents || 0,
            upcomingEvents: stats?.upcomingEvents || 0,
            totalBookings: stats?.totalBookings || 0,
            totalRevenue: stats?.totalRevenue || 0,
            monthlyRevenue: stats?.monthlyRevenue || 0,
            recentEvents: stats?.recentEvents || [],
        };

        const events = eventsData?.data?.events || eventsData?.events || [];
        
        // Show all events (not filtered by creation date for the count)
        // The time range filter applies to bookings/revenue, not event creation
        const allEvents = events;

        // Calculate filtered stats
        const today = new Date().toISOString().split('T')[0];
        
        // Use analytics data for period-specific metrics if available
        const analytics = analyticsData?.data || {};
        
        const filteredStats = {
            // Show all events (not filtered by date range)
            totalEvents: allEvents.length,
            upcomingEvents: allEvents.filter((e: any) => {
                return e.date >= today && e.status === 'published';
            }).length,
            // Use period bookings from analytics if available, otherwise use all-time from stats
            totalBookings: analytics.periodBookings !== undefined ? analytics.periodBookings : statsData.totalBookings,
            // Use period revenue from analytics if available, otherwise use all-time from stats
            totalRevenue: analytics.periodRevenue !== undefined ? analytics.periodRevenue : statsData.totalRevenue,
            monthlyRevenue: statsData.monthlyRevenue, // Use stats from API
            recentEvents: allEvents
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    bookings: 0, // Would need to fetch bookings separately for accurate count
                    status: e.status,
                })),
        };

        return {
            stats: filteredStats,
            events: allEvents,
        };
    }, [stats, eventsData, analyticsData, startDate, endDate, timeRange]);

    // Skeleton loader components
    const SkeletonCard = () => (
        <div className="p-6 border rounded-md bg-card shadow-sm animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-muted rounded w-32"></div>
                <div className="w-5 h-5 bg-muted rounded"></div>
            </div>
            <div className="h-8 bg-muted rounded w-20 mb-2"></div>
            <div className="flex items-center gap-2">
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-4"></div>
            </div>
        </div>
    );

    const SkeletonActionCard = () => (
        <div className="p-6 border rounded-md bg-card shadow-sm animate-pulse cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
                </div>
                <div className="flex-1">
                    <div className="h-6 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-40"></div>
                </div>
            </div>
        </div>
    );

    // Export analytics data
    const handleExport = () => {
        const statsData = filteredData.stats;
        const analytics = analyticsData?.data || {};
        const csvRows = [];
        
        csvRows.push(['Analytics Report']);
        csvRows.push(['Generated', new Date().toISOString()]);
        if (timeRange !== 'all') {
            csvRows.push(['Date Range', `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`]);
        } else {
            csvRows.push(['Date Range', 'All time']);
        }
        csvRows.push(['']);
        csvRows.push(['Summary']);
        csvRows.push(['Total Events', statsData.totalEvents]);
        csvRows.push(['Upcoming Events', statsData.upcomingEvents]);
        csvRows.push(['Total Bookings', statsData.totalBookings]);
        csvRows.push(['Total Revenue', (statsData.totalRevenue / 100).toFixed(2)]);
        csvRows.push(['Monthly Revenue', (statsData.monthlyRevenue / 100).toFixed(2)]);
        csvRows.push(['']);
        
        if (analytics.monthlyRevenue) {
            csvRows.push(['Monthly Revenue Breakdown']);
            csvRows.push(['Month', 'Revenue'].join(','));
            analytics.monthlyRevenue.forEach((item: any) => {
                csvRows.push([item.month, (item.revenue / 100).toFixed(2)].join(','));
            });
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Analytics data exported successfully");
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Organizer Dashboard</h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                        {organizerName} - Manage your events from here.
                    </p>
                </div>

                {/* Statistics Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <SkeletonActionCard />
                    <SkeletonActionCard />
                </div>
            </div>
        );
    }

    // Handle error case - only show error if there's an actual error from the query
    if (error || (stats && !stats.data && stats.success === false)) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Organizer Dashboard</h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                        {organizerName} - Manage your events from here.
                    </p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-destructive">Failed to load statistics</p>
                </div>
            </div>
        );
    }

    const statsData = filteredData.stats;
    const events = filteredData.events;

    // Prepare chart data
    const eventsByStatus = events.reduce((acc: any, event: any) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
    }, {});

    const statusData = Object.entries(eventsByStatus).map(([name, value]) => ({
        name,
        value,
    }));

    const eventsByMode = events.reduce((acc: any, event: any) => {
        acc[event.mode] = (acc[event.mode] || 0) + 1;
        return acc;
    }, {});

    const modeData = Object.entries(eventsByMode).map(([name, value]) => ({
        name,
        value,
    }));

    const getTimeRangeLabel = () => {
        switch (timeRange) {
            case '7days': return 'Last 7 Days';
            case '30days': return 'Last 30 Days';
            case '90days': return 'Last 90 Days';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            case 'custom': return 'Custom Range';
            case 'all':
            default: return 'All Time';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">Organizer Dashboard</h1>
                        {currentPlan && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 inline-flex items-center w-fit">
                                {currentPlan.name}
                            </span>
                        )}
                        {isUpgradable && (
                            <Link href="/organizer-dashboard/billing">
                                <Button variant="outline" size="sm" className="h-7">
                                    <ArrowUp className="w-3 h-3 mr-1" />
                                    Upgrade
                                </Button>
                            </Link>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        {organizerName} - Manage your events from here.
                    </p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Analytics
                </Button>
            </div>

            {/* Global Timeline Picker */}
            <div className="p-4 border rounded-md bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Time Range:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {(['7days', '30days', '90days', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => {
                                    setTimeRange(range);
                                    if (range !== 'custom') {
                                        setDateRange({ startDate: "", endDate: "" });
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    timeRange === range
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                            >
                                {range === '7days' ? '7 Days' :
                                 range === '30days' ? '30 Days' :
                                 range === '90days' ? '90 Days' :
                                 range === 'month' ? 'This Month' :
                                 range === 'year' ? 'This Year' :
                                 'All Time'}
                            </button>
                        ))}
                        <button
                            onClick={() => setTimeRange('custom')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                timeRange === 'custom'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            }`}
                        >
                            Custom
                        </button>
                    </div>
                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2 ml-auto">
                            <FormInput
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-40"
                                placeholder="Start Date"
                            />
                            <span className="text-sm text-muted-foreground">to</span>
                            <FormInput
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-40"
                                placeholder="End Date"
                            />
                        </div>
                    )}
                </div>
                {timeRange !== 'all' && (
                    <div className="mt-3 text-xs text-muted-foreground">
                        Showing data from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Events"
                    value={statsData.totalEvents}
                    icon={<Calendar className="h-5 w-5" />}
                    href="/organizer-dashboard/events"
                    timeRange={getTimeRangeLabel()}
                />
                <StatCard
                    title="Upcoming Events"
                    value={statsData.upcomingEvents}
                    icon={<Clock className="h-5 w-5" />}
                    href="/organizer-dashboard/events"
                    timeRange={getTimeRangeLabel()}
                />
                <StatCard
                    title="Total Bookings"
                    value={statsData.totalBookings}
                    icon={<Ticket className="h-5 w-5" />}
                    href="/organizer-dashboard/attendees"
                    timeRange={getTimeRangeLabel()}
                />
                <StatCard
                    title="Total Revenue"
                    value={`₱${(statsData.totalRevenue / 100).toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    href="/organizer-dashboard/payments"
                    timeRange={getTimeRangeLabel()}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <DashboardCard
                    title="Create Event"
                    description="Create a new event and start accepting bookings"
                    href="/organizer-dashboard/events/create"
                    icon={<Plus className="h-6 w-6" />}
                />
                <DashboardCard
                    title="Events"
                    description="View and manage all your events"
                    href="/organizer-dashboard/events"
                    icon={<Calendar className="h-6 w-6" />}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Event Status Distribution */}
                <div className="p-6 border rounded-md bg-card">
                    <h3 className="text-lg font-semibold mb-4">Events by Status ({getTimeRangeLabel()})</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>

                {/* Event Mode Distribution */}
                <div className="p-6 border rounded-md bg-card">
                    <h3 className="text-lg font-semibold mb-4">Events by Mode ({getTimeRangeLabel()})</h3>
                    {modeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={modeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {modeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Events Performance */}
            {statsData.recentEvents && statsData.recentEvents.length > 0 && (
                <div className="p-6 border rounded-md bg-card">
                    <h3 className="text-lg font-semibold mb-4">Recent Events Performance ({getTimeRangeLabel()})</h3>
                    <div className="space-y-4">
                        {statsData.recentEvents.map((event: any) => (
                            <div key={event.id} className="flex items-center justify-between p-4 border rounded-md">
                                <div>
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {event.date} • {event.bookings} bookings
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        event.status === "published"
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-gray-500/10 text-gray-500"
                                    }`}
                                >
                                    {event.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    href?: string;
    timeRange?: string;
}

function StatCard({ title, value, icon, href, timeRange }: StatCardProps) {
    const cardContent = (
        <div className="p-6 border rounded-md bg-card hover:bg-accent transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="text-muted-foreground">{icon}</div>
            </div>
            <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>
            {timeRange && (
                <p className="text-xs text-muted-foreground mt-1">{timeRange}</p>
            )}
        </div>
    );

    if (href) {
        return <Link href={href}>{cardContent}</Link>;
    }

    return cardContent;
}

function DashboardCard({
    title,
    description,
    href,
    icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="block p-6 border rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Link>
    );
}
