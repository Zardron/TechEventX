import { ChevronRightIcon, Home, Calendar, Users, Plus, Settings, CreditCard, Tag, RefreshCw, DollarSign, Clock, CheckCircle, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const sideBarItems = [
    {
        href: "/organizer-dashboard",
        icon: Home
    },
    {
        href: "/organizer-dashboard/events",
        icon: Calendar
    },
    {
        href: "/organizer-dashboard/events/create",
        icon: Plus
    },
    {
        href: "/organizer-dashboard/attendees",
        icon: Users
    },
    {
        href: "/organizer-dashboard/team",
        icon: Users
    },
    {
        href: "/organizer-dashboard/billing",
        icon: CreditCard
    },
    {
        href: "/organizer-dashboard/promo-codes",
        icon: Tag
    },
    {
        href: "/organizer-dashboard/refunds",
        icon: RefreshCw
    },
    {
        href: "/organizer-dashboard/payments",
        icon: DollarSign
    },
    {
        href: "/organizer-dashboard/waitlist",
        icon: Clock
    },
    {
        href: "/organizer-dashboard/check-in-history",
        icon: CheckCircle
    },
    {
        href: "/organizer-dashboard/attendees/communicate",
        icon: Mail
    },
    {
        href: "/organizer-dashboard/settings",
        icon: Settings
    }
]

const BreadCrumbs = () => {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const currentItem = sideBarItems.find(item => item.href === pathname);
    const Icon = currentItem?.icon;
    const MenuLink = currentItem?.href;

    return (
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <p className="text-xs sm:text-sm font-medium">Dashboard</p>
            <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />

            <Link href={MenuLink || '/'}>
                <div className="flex items-center gap-1 cursor-pointer">
                    {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue" />}
                    <p className="text-xs sm:text-sm font-medium capitalize">{lastSegment !== 'organizer-dashboard' ? lastSegment.replace(/-/g, ' ') : 'Home'}</p>
                </div>

            </Link>
        </div>
    );
};

export default BreadCrumbs;

