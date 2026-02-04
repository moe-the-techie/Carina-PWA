import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // Connection pool size - adjust based on your server capacity
            maxPoolSize: 10,
            minPoolSize: 2,
            
            // Timeouts
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            
            // Keep connections alive
            maxIdleTimeMS: 30000,
        });
        
        console.log('MongoDB connected with optimized pool settings');
        
        // Enable query profiling in development
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', (collectionName, method, query, doc) => {
                // Only log slow queries or mutations in dev
                if (['find', 'findOne', 'aggregate'].includes(method)) {
                    console.log(`[Mongoose] ${collectionName}.${method}`, JSON.stringify(query).slice(0, 100));
                }
            });
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;
