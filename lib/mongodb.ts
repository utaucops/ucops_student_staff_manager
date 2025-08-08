import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async (): Promise<void> => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        isConnected = conn.connections[0].readyState === 1;
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
};
