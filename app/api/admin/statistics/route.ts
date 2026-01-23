import User from "@/database/user.model";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import Organizer from "@/database/organizer.model";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        // Get time range from query parameter
        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || '6months';

        // Verify token
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized - Invalid or missing token" },
                { status: 401 }
            );
        }

        // Get user to check if they are admin (exclude soft-deleted users)
        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        // Get total counts (exclude soft-deleted users)
        const totalUsers = await User.countDocuments({ deleted: { $ne: true } });
        const totalEvents = await Event.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Get organizers count from Organizer collection (exclude soft-deleted)
        const totalOrganizers = await Organizer.countDocuments({ deleted: { $ne: true } });

        // Get user role distribution (exclude soft-deleted users)
        const userRoleDistribution = await User.aggregate([
            {
                $match: {
                    deleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const roleDistribution = userRoleDistribution.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        // Calculate date range based on timeRange parameter
        let startDate: Date | null = null;
        let monthsToShow = 6;
        
        if (timeRange === '1month') {
            monthsToShow = 1;
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 0); // Current month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === '3months') {
            monthsToShow = 3;
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 2); // 2 months ago to include current month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === '6months') {
            monthsToShow = 6;
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 5); // 5 months ago to include current month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === 'all') {
            // For "all", we'll get all events and determine the range from the data
            startDate = null;
            monthsToShow = 12; // Default to 12 months for display, but will include all
        }

        // Get all events - use createdAt if available, otherwise use updatedAt or current date
        // This ensures all events are included even if they don't have createdAt dates
        const now = new Date();
        
        const eventsOverTimePipeline: any[] = [
            {
                $addFields: {
                    // Convert createdAt to date if it's a string, otherwise use as-is
                    createdAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: '$createdAt' }, 'string'] },
                            then: { $dateFromString: { dateString: '$createdAt', onError: null, onNull: null } },
                            else: '$createdAt'
                        }
                    },
                    // Convert updatedAt to date if it's a string, otherwise use as-is
                    updatedAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: '$updatedAt' }, 'string'] },
                            then: { $dateFromString: { dateString: '$updatedAt', onError: null, onNull: null } },
                            else: '$updatedAt'
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Use createdAtDate if it exists and is valid, otherwise use updatedAtDate, or current date as last resort
                    dateToUse: {
                        $cond: {
                            if: { $and: [{ $ne: ['$createdAtDate', null] }, { $ne: ['$createdAtDate', undefined] }] },
                            then: '$createdAtDate',
                            else: {
                                $cond: {
                                    if: { $and: [{ $ne: ['$updatedAtDate', null] }, { $ne: ['$updatedAtDate', undefined] }] },
                                    then: '$updatedAtDate',
                                    else: now // Use current date if neither exists - ensures all events are included
                                }
                            }
                        }
                    }
                }
            }
        ];
        
        // Add date filter if startDate is set
        if (startDate) {
            eventsOverTimePipeline.push({
                $match: {
                    dateToUse: { $gte: startDate }
                }
            });
        }
        
        eventsOverTimePipeline.push(
            {
                $group: {
                    _id: {
                        year: { $year: '$dateToUse' },
                        month: { $month: '$dateToUse' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        );
        
        const eventsOverTime = await Event.aggregate(eventsOverTimePipeline);

        // Get bookings over time range
        const bookingsOverTimePipeline: any[] = [
            {
                $match: {
                    createdAt: { $exists: true, $ne: null }
                }
            },
            {
                $addFields: {
                    // Convert createdAt to date if it's a string
                    createdAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: '$createdAt' }, 'string'] },
                            then: { $dateFromString: { dateString: '$createdAt', onError: null, onNull: null } },
                            else: '$createdAt'
                        }
                    }
                }
            },
            {
                $match: {
                    createdAtDate: { $ne: null }
                }
            }
        ];
        
        // Add date filter if startDate is set
        if (startDate) {
            bookingsOverTimePipeline.push({
                $match: {
                    createdAtDate: { $gte: startDate }
                }
            });
        }
        
        bookingsOverTimePipeline.push(
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAtDate' },
                        month: { $month: '$createdAtDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        );
        
        const bookingsOverTime = await Booking.aggregate(bookingsOverTimePipeline);

        // Get user registrations over time range (exclude soft-deleted users)
        const usersOverTimePipeline: any[] = [
            {
                $match: {
                    deleted: { $ne: true },
                    createdAt: { $exists: true, $ne: null }
                }
            },
            {
                $addFields: {
                    // Convert createdAt to date if it's a string
                    createdAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: '$createdAt' }, 'string'] },
                            then: { $dateFromString: { dateString: '$createdAt', onError: null, onNull: null } },
                            else: '$createdAt'
                        }
                    }
                }
            },
            {
                $match: {
                    createdAtDate: { $ne: null }
                }
            }
        ];
        
        // Add date filter if startDate is set
        if (startDate) {
            usersOverTimePipeline.push({
                $match: {
                    createdAtDate: { $gte: startDate }
                }
            });
        }
        
        usersOverTimePipeline.push(
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAtDate' },
                        month: { $month: '$createdAtDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        );
        
        const usersOverTime = await User.aggregate(usersOverTimePipeline);

        // Helper function to generate complete time series
        // Generates months based on the time range
        const generateCompleteTimeSeries = (
            data: Array<{ month: string; count: number }>,
            startDate: Date | null,
            monthsCount: number
        ): Array<{ month: string; count: number }> => {
            const result: Array<{ month: string; count: number }> = [];
            const dataMap = new Map(data.map(item => [item.month, item.count]));
            
            // If startDate is null (all time), find the earliest date from data or use a default range
            let baseDate: Date;
            if (startDate) {
                baseDate = new Date(startDate);
            } else {
                // For "all time", find the earliest month in the data or default to 12 months ago
                const allMonths = Array.from(dataMap.keys())
                    .map(m => {
                        try {
                            const [year, month] = m.split('-');
                            if (!year || !month) return null;
                            return new Date(parseInt(year), parseInt(month) - 1, 1);
                        } catch {
                            return null;
                        }
                    })
                    .filter((d): d is Date => d !== null);
                
                if (allMonths.length > 0) {
                    baseDate = new Date(Math.min(...allMonths.map(d => d.getTime())));
                } else {
                    baseDate = new Date();
                    baseDate.setMonth(baseDate.getMonth() - 11); // 12 months ago
                }
                // Adjust monthsCount to cover from earliest to now, but limit to reasonable range
                const now = new Date();
                const diffMonths = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth()) + 1;
                monthsCount = Math.min(Math.max(monthsCount, diffMonths), 60); // Cap at 60 months (5 years)
            }
            
            // Generate all months starting from baseDate
            for (let i = 0; i < monthsCount; i++) {
                const date = new Date(baseDate);
                date.setMonth(date.getMonth() + i);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const monthKey = `${year}-${month}`;
                
                result.push({
                    month: monthKey,
                    count: dataMap.get(monthKey) || 0
                });
            }
            
            return result;
        };

        // Format events over time data
        const eventsOverTimeFormatted = eventsOverTime
            .filter((item: any) => item._id && item._id.year && item._id.month)
            .map((item: any) => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                count: item.count || 0
            }));

        // Format bookings over time data
        const bookingsOverTimeFormatted = bookingsOverTime
            .filter((item: any) => item._id && item._id.year && item._id.month)
            .map((item: any) => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                count: item.count || 0
            }));

        // Format users over time data
        const usersOverTimeFormatted = usersOverTime
            .filter((item: any) => item._id && item._id.year && item._id.month)
            .map((item: any) => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                count: item.count || 0
            }));

        // Generate complete time series with all months included
        const completeEventsOverTime = generateCompleteTimeSeries(eventsOverTimeFormatted, startDate, monthsToShow);
        const completeBookingsOverTime = generateCompleteTimeSeries(bookingsOverTimeFormatted, startDate, monthsToShow);
        const completeUsersOverTime = generateCompleteTimeSeries(usersOverTimeFormatted, startDate, monthsToShow);

        // Get events by mode - handle both old and new mode values
        const eventsByMode = await Event.aggregate([
            {
                $match: {
                    $and: [
                        { mode: { $exists: true } },
                        { mode: { $ne: null } },
                        { mode: { $ne: '' } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$mode',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map old mode values to new ones for compatibility
        const modeMapping: Record<string, string> = {
            'online': 'Virtual',
            'Online': 'Virtual',
            'virtual': 'Virtual',
            'Virtual': 'Virtual',
            'offline': 'Onsite',
            'Offline': 'Onsite',
            'onsite': 'Onsite',
            'Onsite': 'Onsite',
            'in-person': 'Onsite',
            'In-Person': 'Onsite',
            'hybrid': 'Hybrid',
            'Hybrid': 'Hybrid',
        };

        const modeDistribution = eventsByMode.reduce((acc: Record<string, number>, item: { _id: string | null; count: number }) => {
            if (!item._id) return acc;
            // Normalize mode value to new format (Virtual, Onsite, Hybrid)
            const rawMode = item._id.trim();
            const normalizedMode = modeMapping[rawMode] || rawMode;
            
            // Only include if it's one of the valid modes
            if (['Virtual', 'Onsite', 'Hybrid'].includes(normalizedMode)) {
                acc[normalizedMode] = (acc[normalizedMode] || 0) + item.count;
            }
            return acc;
        }, {});

        const statistics = {
            totals: {
                users: totalUsers,
                events: totalEvents,
                bookings: totalBookings,
                organizers: totalOrganizers,
            },
            roleDistribution,
            modeDistribution,
            eventsOverTime: completeEventsOverTime,
            bookingsOverTime: completeBookingsOverTime,
            usersOverTime: completeUsersOverTime,
        };

        return handleSuccessResponse("Statistics fetched successfully", statistics);
    } catch (error) {
        return handleApiError(error);
    }
}

