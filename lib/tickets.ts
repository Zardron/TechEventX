import QRCode from 'qrcode';
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
 * Generate QR code data URL for a ticket
 */
export async function generateQRCode(ticketNumber: string, bookingId: string): Promise<string> {
    const data = JSON.stringify({
        ticketNumber,
        bookingId,
        timestamp: Date.now(),
    });

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
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

