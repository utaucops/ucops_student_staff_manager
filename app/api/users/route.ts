import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import {
    getCachedUsers,
    setCachedUsers,
    addUserToCache,
} from "./dataCache";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let users = getCachedUsers();

    // If cache is empty, fetch from DB
    if (users.length === 0) {
        await connectDB();
        users = await User.find().sort({ createdAt: -1 });
        setCachedUsers(users);
    }

    // Apply search filter in memory
    const filtered = search
        ? users.filter(
            (u) =>
                u.firstName.toLowerCase().includes(search.toLowerCase()) ||
                u.lastName.toLowerCase().includes(search.toLowerCase()) ||
                u.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
                u.mavId.toString() === search
        )
        : users;

    return NextResponse.json(filtered);
}

export async function POST(req: Request) {
    await connectDB();
    try {
        const data = await req.json();
        const user = await User.create(data);

        addUserToCache(user);

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
