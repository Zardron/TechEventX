import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Ticket from "@/database/ticket.model";
import Booking from "@/database/booking.model";
import Event from "@/database/event.model";
import { handleApiError } from "@/lib/utils";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import fs from "fs";
import path from "path";

// Ensure this route uses Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ ticketNumber: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { ticketNumber } = await params;
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const ticket = await Ticket.findOne({ ticketNumber })
            .populate({
                path: 'bookingId',
                populate: [
                    {
                        path: 'eventId',
                        model: 'Event',
                    },
                    {
                        path: 'userId',
                        model: 'User',
                        select: 'name email avatar',
                    },
                ],
            });

        if (!ticket) {
            return NextResponse.json(
                { message: "Ticket not found" },
                { status: 404 }
            );
        }

        const booking = ticket.bookingId as any;
        const event = booking?.eventId;
        const bookingUser = booking?.userId as any;

        if (!event) {
            return NextResponse.json(
                { message: "Event not found for this ticket" },
                { status: 404 }
            );
        }

        // Verify ticket belongs to user OR user is organizer/admin of the event
        const isTicketOwner = booking.email === user.email;
        const isAdmin = user.role === 'admin';
        
        // Check if user is organizer of the event
        let isOrganizer = false;
        if (user.role === 'organizer' && event.organizerId) {
            const eventOrganizerId = event.organizerId.toString();
            const userId = user._id.toString();
            const userOrganizerId = user.organizerId?.toString();
            
            isOrganizer = eventOrganizerId === userId || (userOrganizerId && eventOrganizerId === userOrganizerId);
        }

        if (!isTicketOwner && !isOrganizer && !isAdmin) {
            return NextResponse.json(
                { message: "You don't have access to this ticket" },
                { status: 403 }
            );
        }

        // Create PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: [800, 1000] // Wider format for two-column layout
        });

        // Set margins and column widths
        const margin = 50;
        const pageWidth = 800;
        const pageHeight = 1000;
        const columnWidth = (pageWidth - margin * 3) / 2; // Two columns with spacing
        const leftColX = margin;
        const rightColX = margin + columnWidth + margin;
        let leftYPos = margin + 30;
        let rightYPos = margin + 30;

        // Dark background for entire page
        doc.setFillColor(30, 30, 35); // Dark gray background
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Add Logo and TechEventX on the same line at the top
        const headerY = 30;
        try {
            // Read logo file from public folder
            const logoPath = path.join(process.cwd(), 'public', 'icons', 'logo.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                const logoBase64 = logoBuffer.toString('base64');
                
                // Logo and text on same line, centered
                const logoSize = 35; // Logo size
                const textSize = 22; // Font size for TechEventX
                
                // Calculate total width of logo + text + spacing
                doc.setFontSize(textSize);
                doc.setFont('helvetica', 'bold');
                const textWidth = doc.getTextWidth('TechEventX');
                const spacing = 10; // Space between logo and text
                const totalWidth = logoSize + spacing + textWidth;
                
                // Center the logo+text combination
                const startX = (pageWidth - totalWidth) / 2;
                const logoX = startX;
                const logoY = headerY;
                const textX = startX + logoSize + spacing;
                const textY = headerY + logoSize / 2 + textSize / 3; // Vertically center text with logo
                
                // Add logo image
                doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
                
                // Add TechEventX text on same line
                doc.setFontSize(textSize);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255); // White text
                doc.text('TechEventX', textX, textY);
                
                // Update starting positions for content
                leftYPos = headerY + logoSize + 40;
                rightYPos = headerY + logoSize + 40;
            } else {
                // If logo not found, just add TechEventX text
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('TechEventX', pageWidth / 2, headerY + 20, { align: 'center' });
                leftYPos = headerY + 50;
                rightYPos = headerY + 50;
            }
        } catch (error) {
            // If logo fails to load, just add TechEventX text
            console.error('Failed to load logo:', error);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('TechEventX', pageWidth / 2, headerY + 20, { align: 'center' });
            leftYPos = headerY + 50;
            rightYPos = headerY + 50;
        }

        // Add instructional text below logo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180); // Light gray
        const instructionText = 'This is an electronic ticket. Please print/present this ticket at the event entrance.';
        const instructionLines = doc.splitTextToSize(instructionText, pageWidth - 100);
        doc.text(instructionLines, pageWidth / 2, leftYPos, { align: 'center' });
        leftYPos += instructionLines.length * 14 + 30; // Spacing after instruction

        // Store the starting position for both columns
        const contentStartY = leftYPos;

        // LEFT COLUMN - Event Details
        // Event Title - White, bold, large with top padding
        leftYPos = contentStartY + 15; // Add padding on top
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text
        const titleLines = doc.splitTextToSize(event.title, columnWidth - 10);
        doc.text(titleLines, leftColX, leftYPos);
        leftYPos += titleLines.length * 30 + 15; // Spacing after title

        // Attendee Information Section
        if (bookingUser) {
            // Attendee label and value
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180); // Light gray for labels
            doc.text('Attendee', leftColX, leftYPos);
            
            doc.setFontSize(15);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(255, 255, 255); // White for values
            const attendeeName = bookingUser.name || booking.email?.split('@')[0] || 'Guest';
            doc.text(attendeeName, leftColX, leftYPos + 18);
            
            leftYPos += 45; // Spacing between attendee and email
            
            // Email label and value
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180); // Light gray for labels
            doc.text('Email', leftColX, leftYPos);
            
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255); // White for values
            doc.text(booking.email, leftColX, leftYPos + 18);
            
            leftYPos += 45; // Spacing after attendee section
        }

        // Event Details Section
        // Date
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180); // Light gray for labels
        doc.text('Date', leftColX, leftYPos);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255); // White for values
        doc.text(formatDateToReadable(event.date), leftColX, leftYPos + 18);
        
        leftYPos += 40; // Spacing between date and time
        
        // Time
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180); // Light gray for labels
        doc.text('Time', leftColX, leftYPos);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255); // White for values
        doc.text(formatDateTo12Hour(event.time), leftColX, leftYPos + 18);
        
        leftYPos += 40; // Spacing between time and location
        
        // Location
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180); // Light gray for labels
        doc.text('Location', leftColX, leftYPos);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255); // White for values
        doc.text(event.location, leftColX, leftYPos + 18);
        
        leftYPos += 18;
        doc.setFontSize(13);
        doc.setTextColor(180, 180, 180); // Light gray for venue
        doc.text(event.venue, leftColX, leftYPos + 16);

        // RIGHT COLUMN - QR Code and Ticket Number
        // QR Code section with background box - aligned with event title
        const qrSectionPadding = 20;
        const qrSectionWidth = columnWidth;
        const qrSectionStartY = contentStartY; // Same Y position as event title
        const qrSize = 180;
        const qrSectionHeight = 30 + qrSize + 30 + 15; // Label + QR + spacing + instruction
        
        // Background for QR code section
        doc.setFillColor(40, 40, 45); // Slightly lighter dark gray for section
        doc.rect(rightColX, qrSectionStartY, qrSectionWidth, qrSectionHeight, 'F');
        
        // QR Code label with spacing on top
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text
        doc.text('QR Code', rightColX + (columnWidth / 2), qrSectionStartY + 25, { align: 'center' });
        rightYPos = qrSectionStartY + 40; // Spacing after label

        // Generate QR code on-demand using react-qr-code
        try {
            // Use dynamic imports to avoid Turbopack issues with react-dom/server
            const React = (await import("react")).default;
            const { renderToString } = await import("react-dom/server");
            const QRCodeSVG = (await import("react-qr-code")).default;
            const sharp = (await import("sharp")).default;
            
            // Get base URL from request or environment variable
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                           (req.headers.get('origin') || 
                            `https://${req.headers.get('host') || 'localhost:3000'}`);
            
            // Generate QR code with URL pointing to verification page
            const qrCodeUrl = `${baseUrl}/verify/${ticket.ticketNumber}`;
            
            // Render QR code component to SVG string with higher resolution
            const qrCodeSVG = renderToString(
                React.createElement(QRCodeSVG, {
                    value: qrCodeUrl,
                    size: qrSize * 2, // Higher resolution for better quality
                    bgColor: '#FFFFFF',
                    fgColor: '#000000',
                    level: 'M',
                })
            );
            
            // Extract SVG content (remove XML declaration if present)
            const svgContent = qrCodeSVG.replace(/^<\?xml[^>]*\?>/, '').trim();
            
            // Convert SVG to PNG buffer using sharp and resize to desired size
            const pngBuffer = await sharp(Buffer.from(svgContent))
                .png()
                .resize(qrSize, qrSize)
                .toBuffer();
            
            // Convert PNG buffer to base64
            const base64Data = pngBuffer.toString('base64');
            
            // Calculate QR code size and position (centered in column)
            const qrX = rightColX + (columnWidth - qrSize) / 2;
            
            // White background for QR code
            doc.setFillColor(255, 255, 255);
            doc.rect(qrX - 8, rightYPos - 8, qrSize + 16, qrSize + 16, 'F');
            
            // Thin border around QR code
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.rect(qrX - 8, rightYPos - 8, qrSize + 16, qrSize + 16);
            
            // Add QR code image
            doc.addImage(base64Data, 'PNG', qrX, rightYPos, qrSize, qrSize);
            rightYPos += qrSize + 15; // Spacing after QR code
            
            // Instruction text below QR code
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180); // Light gray
            rightYPos += 25; // Spacing after instruction
        } catch (error) {
            // If QR code generation fails, just show text
            console.error('Error generating QR code for PDF:', error);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180);
            doc.text('QR Code available on digital ticket', rightColX + (columnWidth / 2), rightYPos, { align: 'center' });
            rightYPos += 30;
        }

        // Ticket Number section with background box
        rightYPos += 20; // Spacing between sections
        
        // Background for ticket number section
        doc.setFillColor(40, 40, 45); // Slightly lighter dark gray for section
        doc.rect(rightColX, rightYPos - 10, qrSectionWidth, 70, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180); // Light gray for label
        doc.text('Ticket Number', rightColX + 15, rightYPos + 10);
        
        doc.setFontSize(18);
        doc.setFont('courier', 'bold');
        doc.setTextColor(255, 255, 255); // White for ticket number
        doc.text(ticket.ticketNumber, rightColX + 15, rightYPos + 35);
        doc.setFont('helvetica', 'normal');

        // Footer
        const footerY = pageHeight - 40;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150); // Light gray
        doc.text('This is an electronic ticket. Please print/present this ticket at the event entrance.', pageWidth / 2, footerY, { align: 'center' });

        // Generate PDF buffer
        const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        // Return PDF as response
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ticket-${ticketNumber}.pdf"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
