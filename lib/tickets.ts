import crypto from 'crypto';

/**
 * Generate a unique ticket number
 */
export function generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TKT-${timestamp}-${random}`;
}

/**
 * Calculate platform fee and organizer revenue
 */
export function calculateRevenue(amount: number, platformFeePercentage: number = 5): {
    platformFee: number;
    organizerRevenue: number;
} {
    const platformFee = Math.round(amount * (platformFeePercentage / 100));
    const organizerRevenue = amount - platformFee;
    
    return {
        platformFee,
        organizerRevenue,
    };
}

