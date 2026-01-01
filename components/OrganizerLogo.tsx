"use client"

import Image from "next/image";
import { useState } from "react";

interface OrganizerLogoProps {
    organizer: string;
    logoUrl?: string;
}

// Mapping of company names to their actual logo URLs
// Using Apistemic Logos API - provides PNG logos (format: https://logos-api.apistemic.com/domain:{domain})
const COMPANY_LOGOS: Record<string, string> = {
    "Meta": "https://logos-api.apistemic.com/domain:meta.com",
    "meta": "https://logos-api.apistemic.com/domain:meta.com",
    "Facebook": "https://logos-api.apistemic.com/domain:facebook.com",
    "Google": "https://logos-api.apistemic.com/domain:google.com",
    "google": "https://logos-api.apistemic.com/domain:google.com",
    "Microsoft": "https://logos-api.apistemic.com/domain:microsoft.com",
    "microsoft": "https://logos-api.apistemic.com/domain:microsoft.com",
    "Apple": "https://logos-api.apistemic.com/domain:apple.com",
    "apple": "https://logos-api.apistemic.com/domain:apple.com",
    "Amazon": "https://logos-api.apistemic.com/domain:amazon.com",
    "amazon": "https://logos-api.apistemic.com/domain:amazon.com",
    "Netflix": "https://logos-api.apistemic.com/domain:netflix.com",
    "netflix": "https://logos-api.apistemic.com/domain:netflix.com",
    "GitHub": "https://logos-api.apistemic.com/domain:github.com",
    "github": "https://logos-api.apistemic.com/domain:github.com",
    "Github": "https://logos-api.apistemic.com/domain:github.com",
    "Vercel": "https://logos-api.apistemic.com/domain:vercel.com",
    "vercel": "https://logos-api.apistemic.com/domain:vercel.com",
    "Stripe": "https://logos-api.apistemic.com/domain:stripe.com",
    "stripe": "https://logos-api.apistemic.com/domain:stripe.com",
    "Shopify": "https://logos-api.apistemic.com/domain:shopify.com",
    "shopify": "https://logos-api.apistemic.com/domain:shopify.com",
    "MongoDB": "https://logos-api.apistemic.com/domain:mongodb.com",
    "mongodb": "https://logos-api.apistemic.com/domain:mongodb.com",
    "Firebase": "https://logos-api.apistemic.com/domain:firebase.google.com",
    "firebase": "https://logos-api.apistemic.com/domain:firebase.google.com",
    "Adobe": "https://logos-api.apistemic.com/domain:adobe.com",
    "adobe": "https://logos-api.apistemic.com/domain:adobe.com",
    "Salesforce": "https://logos-api.apistemic.com/domain:salesforce.com",
    "salesforce": "https://logos-api.apistemic.com/domain:salesforce.com",
    "Oracle": "https://logos-api.apistemic.com/domain:oracle.com",
    "oracle": "https://logos-api.apistemic.com/domain:oracle.com",
    "IBM": "https://logos-api.apistemic.com/domain:ibm.com",
    "ibm": "https://logos-api.apistemic.com/domain:ibm.com",
};

// Helper function to extract company name and get logo
const getOrganizerLogo = (organizer: string): string | null => {
    // Clean the organizer string
    const cleanOrganizer = organizer.trim();

    // Try exact match first
    if (COMPANY_LOGOS[cleanOrganizer]) {
        return COMPANY_LOGOS[cleanOrganizer];
    }

    // Try to match by checking if organizer string contains company name
    const lowerOrganizer = cleanOrganizer.toLowerCase();
    for (const [companyName, logoUrl] of Object.entries(COMPANY_LOGOS)) {
        const lowerCompany = companyName.toLowerCase();
        if (lowerOrganizer.includes(lowerCompany) || lowerCompany.includes(lowerOrganizer)) {
            return logoUrl;
        }
    }

    // Try using first word as potential company name
    const firstWord = cleanOrganizer.split(/\s+/)[0];
    if (COMPANY_LOGOS[firstWord] || COMPANY_LOGOS[firstWord.toLowerCase()]) {
        return COMPANY_LOGOS[firstWord] || COMPANY_LOGOS[firstWord.toLowerCase()];
    }

    // Return null to use fallback
    return null;
};

const OrganizerLogo = ({ organizer, logoUrl }: OrganizerLogoProps) => {
    const [imageError, setImageError] = useState(false);
    const defaultLogoUrl = logoUrl || getOrganizerLogo(organizer);

    // Get initials as fallback
    const getInitials = () => {
        const words = organizer.trim().split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return organizer.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col items-center justify-center group py-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl glass p-3 flex items-center justify-center hover:scale-110 transition-all duration-300 border border-blue/20 group-hover:border-blue/50 hover:shadow-[0_0_20px_rgba(148,234,255,0.2)] bg-background/10 backdrop-blur-sm">
                {defaultLogoUrl && !imageError ? (
                    <div className="w-full h-full flex items-center justify-center bg-background/10 rounded-lg p-2 transition-all duration-300">
                        <Image
                            src={defaultLogoUrl}
                            alt={organizer}
                            width={80}
                            height={80}
                            className="object-contain opacity-95 group-hover:opacity-100 transition-opacity duration-300 w-full h-full"
                            onError={() => setImageError(true)}
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background/10 rounded-lg">
                        <div className="text-blue text-lg font-bold text-center px-2">
                            {getInitials()}
                        </div>
                    </div>
                )}
            </div>
            {/* Organizer name on hover */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-light-200 text-sm text-center font-medium whitespace-nowrap">
                    {organizer.length > 20 ? organizer.substring(0, 20) + '...' : organizer}
                </p>
            </div>
        </div>
    );
};

export default OrganizerLogo;
