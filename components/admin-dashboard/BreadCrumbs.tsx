import { ChevronRightIcon, Home, Users, Plus, FolderKanbanIcon, Calendar, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const sideBarItems = [
    {
        href: "/admin-dashboard",
        icon: Home
    },
    {
        href: "/admin-dashboard/all-users",
        icon: Users
    },
    {
        href: "/admin-dashboard/add-users",
        icon: Plus
    },
    {
        href: "/admin-dashboard/all-organizers",
        icon: FolderKanbanIcon
    },
    {
        href: "/admin-dashboard/add-organizers",
        icon: Plus
    },
    {
        href: "/admin-dashboard/all-events",
        icon: Calendar
    },
    {
        href: "/admin-dashboard/add-events",
        icon: Plus
    },
    {
        href: "/admin-dashboard/settings",
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
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Dashboard</p>
            <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 shrink-0" />

            <Link href={MenuLink || '/'}>
                <div className="flex items-center gap-1 cursor-pointer">
                    {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue shrink-0" />}
                    <p className="text-xs sm:text-sm font-medium capitalize whitespace-nowrap">{lastSegment !== 'admin-dashboard' ? lastSegment : 'Home'}</p>
                </div>

            </Link>
        </div>
    );
};

export default BreadCrumbs;