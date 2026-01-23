import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Booking from './booking.model';

export interface ITicket extends Document {
    bookingId: Types.ObjectId;
    ticketNumber: string; // Unique ticket identifier
    qrCode: string; // QR code data or URL
    status: 'active' | 'used' | 'cancelled' | 'transferred';
    checkedInAt?: Date;
    checkedInBy?: Types.ObjectId; // User ID who checked in
    transferredTo?: Types.ObjectId; // User ID if transferred
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking ID is required'],
        },
        ticketNumber: {
            type: String,
            required: [true, 'Ticket number is required'],
            unique: true,
            trim: true,
            index: true,
        },
        qrCode: {
            type: String,
            required: [true, 'QR code is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'used', 'cancelled', 'transferred'],
            default: 'active',
            index: true,
        },
        checkedInAt: {
            type: Date,
        },
        checkedInBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        transferredTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ ticketNumber: 1 }, { unique: true });
ticketSchema.index({ status: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema);
export default Ticket;

