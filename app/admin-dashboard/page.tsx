"use client"

import SideBar from "@/components/admin-dashboard/SideBar"
import Navbar from "@/components/admin-dashboard/Navbar"
import { useState } from "react"

const page = () => {
    const [sideBarCollapsed, setSideBarCollapsed] = useState(false)

    return (
        <div className="flex">
            <div className={`h-screen ${sideBarCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 overflow-hidden`}>
                <SideBar />
            </div>
            <div className="flex-1">
                <Navbar sideBarCollapsed={sideBarCollapsed} setSideBarCollapsed={setSideBarCollapsed} />
                <h1>Admin Dashboard</h1>
            </div>
        </div>
    )
}

export default page