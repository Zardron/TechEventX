import Image from "next/image"
import Link from "next/link"

const SideBar = () => {
    return (
        <div className="flex flex-col gap-4 h-full border-r border-border-dark">
            <Link href="/admin-dashboard">
                <div className="flex items-center gap-2 p-4 border-b border-border-dark">
                    <Image src="/icons/logo.png" alt="logo" width={24} height={24} />
                    <h3>TechHub</h3>
                </div>
            </Link>
        </div>
    )
}

export default SideBar