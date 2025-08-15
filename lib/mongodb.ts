// lib/mongoose.ts
import mongoose, { Mongoose } from "mongoose";

let cachedConnection: Mongoose | null = null;

export async function connectDB(): Promise<Mongoose> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");

    if (cachedConnection) {
        console.log("Using cached MongoDB connection.");
        return cachedConnection;
    }

    try {
        const connectionInstance = await mongoose.connect(uri, {
            maxPoolSize: 10,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
        });
        cachedConnection = connectionInstance;
        console.log(`MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // In libraries / Next.js, prefer throwing over exiting the process
        throw error;
    }
}
