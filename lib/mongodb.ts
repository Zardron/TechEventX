import mongoose, { Mongoose } from 'mongoose';

const getMongoURI = (): string => {
    if (process.env.MONGODB_URI) {
        const uri = process.env.MONGODB_URI.trim();
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log('🔗 MongoDB: Using MONGODB_URI:', maskedUri);
        return uri;
    }

    const { MONGO_DB_SRV, MONGO_DB_USER, MONGO_DB_PASSWORD, MONGO_DB_NAME } = process.env;
    if (!MONGO_DB_SRV || !MONGO_DB_USER || !MONGO_DB_PASSWORD || !MONGO_DB_NAME) {
        throw new Error('Missing MongoDB env vars: MONGODB_URI or MONGO_DB_*');
    }

    let srv = MONGO_DB_SRV.trim();
    
    if (srv.startsWith('mongodb+srv://')) {
        srv = srv.replace('mongodb+srv://', '');
    }
    
    srv = srv.replace(/\/$/, '');
    
    if (!srv.includes('.mongodb.net')) {
        console.warn('⚠️  Warning: MONGO_DB_SRV does not contain ".mongodb.net" - this may cause connection issues');
        console.warn('   Expected format: cluster0.xxxxx.mongodb.net');
        console.warn('   Got:', srv);
    }
    
    const uri = `mongodb+srv://${MONGO_DB_USER}:${encodeURIComponent(MONGO_DB_PASSWORD)}@${srv}/${MONGO_DB_NAME}`;
    
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log('🔗 MongoDB: Constructed URI:', maskedUri);
    
    return uri;
};

let connectionPromise: Promise<Mongoose> | null = null;

async function connectDB(): Promise<Mongoose> {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose as Mongoose;
        }

        if (connectionPromise) {
            return connectionPromise;
        }

        const mongoURI = getMongoURI();
        
        try {
            const url = new URL(mongoURI.replace('mongodb+srv://', 'https://'));
            const hostname = url.hostname;
            console.log('🔍 MongoDB: Attempting to connect to hostname:', hostname);
        } catch (e) {
        }
        
        connectionPromise = mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            retryWrites: true,
            retryReads: true,
        })
            .then((conn) => {
                console.log('✅ MongoDB: Connected successfully');
                return conn;
            })
            .catch((error) => {
                connectionPromise = null;
                console.error('❌ MongoDB: Connection failed');
                console.error('   Error code:', error.code);
                console.error('   Error message:', error.message);
                
                if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
                    console.error('   💡 This is a DNS resolution error. Possible causes:');
                    console.error('      - MongoDB cluster is still deploying (check Atlas dashboard)');
                    console.error('      - Invalid MongoDB cluster hostname');
                    console.error('      - Network connectivity issues');
                    console.error('      - MongoDB cluster may have been deleted or renamed');
                    console.error('   💡 Solutions:');
                    console.error('      1. Wait for cluster deployment to complete in MongoDB Atlas');
                    console.error('      2. Get a fresh connection string from Atlas "Connect" button');
                    console.error('      3. Verify your MONGODB_URI in .env file');
                }
                
                throw error;
            });

        return connectionPromise;
    } catch (error) {
        connectionPromise = null;
        console.error('❌ MongoDB: Connection failed', error);
        throw error;
    }
}

export default connectDB;
