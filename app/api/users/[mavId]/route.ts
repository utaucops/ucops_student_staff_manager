import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import {
    updateUserInCache,
    deleteUserFromCache,
} from "../dataCache";

interface Params {
    params: { mavId: string };
}

export async function PUT(req: Request, { params }: Params) {
    await connectDB();
    const data = await req.json();
    const updatedUser = await User.findOneAndUpdate(
        { mavId: params.mavId },
        data,
        { new: true }
    );

    if (updatedUser) {
        updateUserInCache(updatedUser);
    }

    return NextResponse.json(updatedUser);
}

export async function DELETE(req: Request, { params }: Params) {
    await connectDB();
    const deleted = await User.findOneAndDelete({ mavId: params.mavId });

    if (deleted) {
        deleteUserFromCache(Number(params.mavId));
    }

    return NextResponse.json({ message: "User deleted" });
}
