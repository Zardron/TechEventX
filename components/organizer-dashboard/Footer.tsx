"use client";

import Link from 'next/link';
const currentYear = new Date().getFullYear();

const Footer = () => {
    return (
        <>
            {/* Divider */}
            <div className="relative my-8" >
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-dark" />
                </div>
                <div className="relative flex justify-center">
                    <div className="bg-background px-4">
                        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue to-transparent rounded-full" />
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="flex justify-center items-center gap-4 text-center">
                <p className="text-light-200 text-sm">
                    © {currentYear} <span className="text-blue font-semibold">TechEventX</span> created by <span className="text-primary">Zardron</span>. All rights reserved.
                </p>
            </div>
        </>
    )
}

export default Footer

