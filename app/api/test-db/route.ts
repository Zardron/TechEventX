import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await connectDB();

        const connectionState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        return NextResponse.json({
            status: 'success',
            connected: connectionState === 1,
            connectionState: states[connectionState as keyof typeof states],
            dbName: mongoose.connection.db?.databaseName,
            host: mongoose.connection.host,
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
