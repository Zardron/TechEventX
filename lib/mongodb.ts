import mongoose, { Mongoose } from 'mongoose';

type MongooseCache = { conn: Mongoose | null; promise: Promise<Mongoose> | null };

declare global {
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

const getMongoURI = (): string => {
    if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

    const { MONGO_DB_SRV, MONGO_DB_USER, MONGO_DB_PASSWORD, MONGO_DB_NAME } = process.env;
    if (!MONGO_DB_SRV || !MONGO_DB_USER || !MONGO_DB_PASSWORD || !MONGO_DB_NAME) {
        throw new Error('Missing MongoDB env vars: MONGODB_URI or MONGO_DB_*');
    }

    return `${MONGO_DB_SRV}${MONGO_DB_USER}:${encodeURIComponent(MONGO_DB_PASSWORD)}${MONGO_DB_NAME}`;
};

async function connectDB(): Promise<Mongoose> {
    if (cached.conn) {
        console.log('✅ MongoDB: Using cached connection');
        return cached.conn;
    }

    cached.promise ??= mongoose.connect(getMongoURI(), { bufferCommands: false });

    try {
        cached.conn = await cached.promise;
        global.mongoose = cached;
        console.log('✅ MongoDB: Connected successfully');
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error('❌ MongoDB: Connection failed', error);
        throw error;
    }
}

export default connectDB;
