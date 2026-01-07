import { useMemo } from "react";
import { useGetAllUsers } from "@/lib/hooks/api/user.queries";
import { IUser } from "@/database/user.model";
import { SAMPLE_ORGANIZERS, ORGANIZER_EMAILS } from "@/lib/constants";

export interface OrganizerOption {
    name: string;
    email: string;
    isSample: boolean;
}

export const useOrganizers = () => {
    const { data, isLoading } = useGetAllUsers();

    const organizers = useMemo(() => {
        const result: OrganizerOption[] = [];

        // Add actual organizer user accounts from database
        if (data?.data) {
            const userOrganizers = data.data
                .filter((user: IUser) => user.role === 'organizer')
                .map((user: IUser) => ({
                    name: user.name,
                    email: user.email,
                    isSample: false,
                }));
            result.push(...userOrganizers);
        }

        // Add sample organizers with their emails
        const sampleOrganizers: OrganizerOption[] = SAMPLE_ORGANIZERS.map((name) => ({
            name,
            email: ORGANIZER_EMAILS[name] || `contact@${name.toLowerCase()}.com`,
            isSample: true,
        }));

        // Only add sample organizers that don't already exist as user accounts
        const existingNames = new Set(result.map(org => org.name.toLowerCase()));
        sampleOrganizers.forEach(sample => {
            if (!existingNames.has(sample.name.toLowerCase())) {
                result.push(sample);
            }
        });

        // Sort by name
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    return {
        organizers,
        isLoading,
    };
};

