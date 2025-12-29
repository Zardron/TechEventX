"use client"

import Link from "next/link"
import Image from "next/image"
import posthog from "posthog-js"

const Navbar = () => {
    const handleLogoClick = () => {
        posthog.capture('logo_clicked', {
            nav_location: 'header',
        });
    };

    const handleNavClick = (navItem: string) => {
        posthog.capture(`nav_${navItem}_clicked`, {
            nav_item: navItem,
            nav_location: 'header',
        });
    };

    return (
        <header >
            <nav>
                <Link href="/" className="logo" onClick={handleLogoClick}>
                    <Image src="/icons/logo.png" alt="Logo" width={24} height={24} />
                    <p>DevHub</p>
                </Link>

                <ul>
                    <li>
                        <Link href="/" onClick={() => handleNavClick('home')}>Home</Link>
                    </li>
                    <li>
                        <Link href="/" onClick={() => handleNavClick('events')}>Events</Link>
                    </li>
                    <li>
                        <Link href="/" onClick={() => handleNavClick('create_event')}>Create Event</Link>
                    </li>
                </ul>
            </nav>
        </header>
    )
}

export default Navbar