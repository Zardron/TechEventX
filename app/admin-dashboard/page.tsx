"use client";

import Link from "next/link";
import { useState } from "react";
import { useDashboardStatistics } from "@/lib/hooks/api/admin.queries";
import { Users, Calendar, Ticket, Building2, TrendingUp, TrendingDown } from "lucide-react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = {
    primary: "#8884d8", // Purple for Events
    secondary: "#82ca9d", // Green for Bookings
    tertiary: "#ffc658", // Orange for Users
    accent: "#ff7300",
};

const ROLE_COLORS = {
    admin: "#8884d8", // Light purple for Admins
    user: "#82ca9d", // Light green for Users
    organizer: "#ffc658", // Orange for Organizers
};

const MODE_COLORS = {
    Virtual: "#82ca9d",  // Green for Virtual
    Onsite: "#8884d8",   // Purple for Onsite
    Hybrid: "#ff7300",   // Orange for Hybrid
};

type ChartType = "area" | "line" | "bar";

// Helper function to calculate trend percentage
// Compares the last period (last month) with the previous period (second to last month)
function calculateTrend(
    timeSeries: Array<{ month: string; count: number }> | undefined,
    currentTotal: number
): { current: number; previous: number } | null {
    if (!timeSeries || timeSeries.length < 2) {
        return null;
    }
    
    // Sort by month to ensure correct order
    const sorted = [...timeSeries].sort((a, b) => a.month.localeCompare(b.month));
    
    if (sorted.length < 2) {
        return null;
    }
    
    // Get the last two months for comparison
    const lastMonth = sorted[sorted.length - 1];
    const previousMonth = sorted[sorted.length - 2];
    
    // Compare the counts of the last two months
    if (previousMonth.count > 0) {
        return {
            current: lastMonth.count,
            previous: previousMonth.count,
        };
    }
    
    return null;
}

type TimeRange = "1month" | "3months" | "6months" | "all";

export default function AdminDashboardPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>("6months");
    const { data: statisticsData, isLoading, error } = useDashboardStatistics(timeRange);
    const [growthChartType, setGrowthChartType] = useState<ChartType>("area");
    const [eventsChartType, setEventsChartType] = useState<ChartType>("bar");

    // Skeleton loader components
    const SkeletonCard = () => (
        <div className="p-6 border rounded-lg bg-card shadow-sm animate-pulse">
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

    const SkeletonChart = () => (
        <div className="p-6 border rounded-lg bg-card shadow-sm animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-muted rounded w-56"></div>
                <div className="flex items-center gap-2">
                    <div className="h-8 bg-muted rounded w-28"></div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                </div>
            </div>
            <div className="h-[300px] bg-muted/10 rounded border border-muted/20 relative overflow-hidden">
                {/* Chart grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-px bg-muted/20 w-full"></div>
                    ))}
                </div>
                {/* Chart bars/lines */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    {[...Array(6)].map((_, i) => (
                        <div 
                            key={i} 
                            className="flex-1 bg-muted/40 rounded-t" 
                            style={{ height: `${30 + Math.random() * 50}%` }}
                        ></div>
                    ))}
                </div>
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-4 right-4 flex justify-between pb-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-3 bg-muted/30 rounded w-12"></div>
                    ))}
                </div>
            </div>
        </div>
    );

    const SkeletonPieChart = () => (
        <div className="p-6 border rounded-lg bg-card shadow-sm animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4"></div>
            <div className="h-[300px] bg-muted/10 rounded border border-muted/20 flex items-center justify-center relative">
                <div className="w-48 h-48 bg-muted/30 rounded-full relative overflow-hidden">
                    {/* Pie segments simulation */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-muted/40 rounded-l-full"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted/50 rounded-tr-full"></div>
                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-muted/30 rounded-br-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const SkeletonActionCard = () => (
        <div className="p-6 border rounded-lg bg-card shadow-sm animate-pulse cursor-pointer hover:bg-accent transition-colors">
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome to the admin dashboard. Manage your platform from here.
                    </p>
                </div>

                {/* Statistics Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                {/* Charts Section Skeleton */}
                <div className="grid gap-6 md:grid-cols-2">
                    <SkeletonChart />
                    <SkeletonPieChart />
                </div>

                {/* Events Charts Section Skeleton */}
                <div className="grid gap-6 md:grid-cols-2">
                    <SkeletonChart />
                    <SkeletonPieChart />
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <SkeletonActionCard />
                    <SkeletonActionCard />
                    <SkeletonActionCard />
                </div>
            </div>
        );
    }

    if (error || !statisticsData) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome to the admin dashboard. Manage your platform from here.
                    </p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <p className="text-destructive">Failed to load statistics</p>
                </div>
            </div>
        );
    }

    const stats = statisticsData;
    const totals = stats.totals || { users: 0, events: 0, bookings: 0, organizers: 0 };

    // Prepare role distribution data for pie chart
    const roleData = [
        { name: "Users", value: stats.roleDistribution?.user || 0, color: ROLE_COLORS.user },
        { name: "Admins", value: stats.roleDistribution?.admin || 0, color: ROLE_COLORS.admin },
        { name: "Organizers", value: stats.roleDistribution?.organizer || 0, color: ROLE_COLORS.organizer },
    ].filter((item) => item.value > 0);

    // Prepare mode distribution data for pie chart
    const modeData = [
        { name: "Virtual", value: stats.modeDistribution?.Virtual || 0, color: MODE_COLORS.Virtual },
        { name: "Onsite", value: stats.modeDistribution?.Onsite || 0, color: MODE_COLORS.Onsite },
        { name: "Hybrid", value: stats.modeDistribution?.Hybrid || 0, color: MODE_COLORS.Hybrid },
    ].filter((item) => item.value > 0);

    // Prepare combined chart data for events, bookings, and users over time
    interface TimeDataPoint {
        month: string;
        events: number;
        bookings: number;
        users: number;
    }

    // Use the complete time series from API (all 6 months are guaranteed)
    // Create a map for quick lookup
    const eventsMap = new Map((stats.eventsOverTime || []).map(item => [item.month, item.count]));
    const bookingsMap = new Map((stats.bookingsOverTime || []).map(item => [item.month, item.count]));
    const usersMap = new Map((stats.usersOverTime || []).map(item => [item.month, item.count]));

    // Get all unique months from the API responses (should be 6 months)
    const allMonths = new Set([
        ...(stats.eventsOverTime || []).map((item) => item.month),
        ...(stats.bookingsOverTime || []).map((item) => item.month),
        ...(stats.usersOverTime || []).map((item) => item.month),
    ]);

    // Build combined data using all months from API
    const combinedTimeData: TimeDataPoint[] = Array.from(allMonths)
        .sort()
        .map((month) => {
            const eventCount = eventsMap.get(month) || 0;
            const bookingCount = bookingsMap.get(month) || 0;
            const userCount = usersMap.get(month) || 0;
            // Format as MM/YY - extract month and year from "YYYY-MM" format
            const [year, monthNum] = month.split("-");
            return {
                month: `${monthNum}/${year.slice(2)}`, // Format as MM/YY (e.g., 12/25 for December 2025, 01/26 for January 2026)
                events: eventCount,
                bookings: bookingCount,
                users: userCount,
            };
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                        Welcome to the admin dashboard. Manage your platform from here.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="timeRange" className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                        Time Range:
                    </label>
                    <select
                        id="timeRange"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                        className="h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="1month">Last 1 Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={totals.users}
                    icon={<Users className="h-5 w-5" />}
                    href="/admin-dashboard/all-users"
                    trend={calculateTrend(stats.usersOverTime, totals.users)}
                />
                <StatCard
                    title="Total Events"
                    value={totals.events}
                    icon={<Calendar className="h-5 w-5" />}
                    href="/admin-dashboard/all-events"
                    trend={calculateTrend(stats.eventsOverTime, totals.events)}
                />
                <StatCard
                    title="Total Bookings"
                    value={totals.bookings}
                    icon={<Ticket className="h-5 w-5" />}
                    href="/admin-dashboard/all-events"
                    trend={calculateTrend(stats.bookingsOverTime, totals.bookings)}
                />
                <StatCard
                    title="Organizers"
                    value={totals.organizers}
                    icon={<Building2 className="h-5 w-5" />}
                    href="/admin-dashboard/all-organizers"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {/* Growth Over Time Chart */}
                <div className="p-3 sm:p-6 border rounded-lg bg-card shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                        <h3 className="text-base sm:text-lg font-semibold">Growth Over Time</h3>
                        <select
                            value={growthChartType}
                            onChange={(e) => setGrowthChartType(e.target.value as ChartType)}
                            className="h-8 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="area">Area Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="bar">Bar Chart</option>
                        </select>
                    </div>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        {growthChartType === "area" ? (
                            <AreaChart data={combinedTimeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="events"
                                    stackId="1"
                                    stroke={COLORS.primary}
                                    fill={COLORS.primary}
                                    fillOpacity={0.6}
                                    name="Events"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bookings"
                                    stackId="1"
                                    stroke={COLORS.secondary}
                                    fill={COLORS.secondary}
                                    fillOpacity={0.6}
                                    name="Bookings"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stackId="1"
                                    stroke={COLORS.tertiary}
                                    fill={COLORS.tertiary}
                                    fillOpacity={0.6}
                                    name="Users"
                                />
                            </AreaChart>
                        ) : growthChartType === "line" ? (
                            <LineChart data={combinedTimeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="events"
                                    stroke={COLORS.primary}
                                    strokeWidth={2}
                                    name="Events"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke={COLORS.secondary}
                                    strokeWidth={2}
                                    name="Bookings"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke={COLORS.tertiary}
                                    strokeWidth={2}
                                    name="Users"
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={combinedTimeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="events" fill={COLORS.primary} name="Events" />
                                <Bar dataKey="bookings" fill={COLORS.secondary} name="Bookings" />
                                <Bar dataKey="users" fill={COLORS.tertiary} name="Users" />
                            </BarChart>
                        )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Role Distribution */}
                <div className="p-3 sm:p-6 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">User Role Distribution</h3>
                    {roleData.length > 0 ? (
                        <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {/* Events Over Time */}
                <div className="p-3 sm:p-6 border rounded-lg bg-card shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                        <h3 className="text-base sm:text-lg font-semibold">Events Created Over Time</h3>
                        <select
                            value={eventsChartType}
                            onChange={(e) => setEventsChartType(e.target.value as ChartType)}
                            className="h-8 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="bar">Bar Chart</option>
                        </select>
                    </div>
                    {combinedTimeData.length > 0 ? (
                        <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {eventsChartType === "line" ? (
                                <LineChart data={combinedTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="events"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        name="Events"
                                    />
                                </LineChart>
                            ) : eventsChartType === "area" ? (
                                <AreaChart data={combinedTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="events"
                                        stroke={COLORS.primary}
                                        fill={COLORS.primary}
                                        name="Events"
                                    />
                                </AreaChart>
                            ) : (
                                <BarChart data={combinedTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="events" fill={COLORS.primary} name="Events" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>

                {/* Event Mode Distribution */}
                <div className="p-3 sm:p-6 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Event Mode Distribution</h3>
                    {modeData.length > 0 ? (
                        <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={modeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {modeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Users"
                    description="Manage platform users"
                    href="/admin-dashboard/all-users"
                    icon={<Users className="h-6 w-6" />}
                />
                <DashboardCard
                    title="Organizers"
                    description="Manage event organizers"
                    href="/admin-dashboard/all-organizers"
                    icon={<Building2 className="h-6 w-6" />}
                />
                <DashboardCard
                    title="Events"
                    description="Manage events"
                    href="/admin-dashboard/all-events"
                    icon={<Calendar className="h-6 w-6" />}
                />
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    href?: string;
    trend?: { current: number; previous: number } | null;
}

function StatCard({ title, value, icon, href, trend }: StatCardProps) {
    const trendPercentage =
        trend && trend.previous > 0
            ? ((trend.current - trend.previous) / trend.previous) * 100
            : null;

    const isPositive = trendPercentage !== null && trendPercentage >= 0;

    const cardContent = (
        <div className="p-6 border rounded-lg bg-card hover:bg-accent transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="text-muted-foreground">{icon}</div>
            </div>
            <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                {trendPercentage !== null && (
                    <div className="flex items-center gap-1 text-sm">
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={isPositive ? "text-green-500" : "text-red-500"}>
                            {isPositive ? "+" : ""}
                            {trendPercentage.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
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
            className="block p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Link>
    );
}
