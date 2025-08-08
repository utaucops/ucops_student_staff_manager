import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { setCachedUsers, getCachedUsers } from "../dataCache";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const users = await User.find().sort({ createdAt: -1 });
        setCachedUsers(users);

        return NextResponse.json({
            message: "Cache refreshed successfully",
            total: users.length,
            sample: users.slice(0, 3), // optional preview
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to refresh cache", details: error.message },
            { status: 500 }
        );
    }
}
