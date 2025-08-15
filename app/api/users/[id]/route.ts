// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
    getById as repoGetById,
    updateUserById as repoUpdateUserById,
    deleteUserById as repoDeleteUserById,
} from "@/lib/repositories/userRepository";
import {
    getCachedUsers,
    setCachedUsers,
} from "@/lib/utils/userCache";
import type { UserClientDAO } from "@/types/userDao.client";

function replaceUserInCacheById(updated: any) {
    const cached = getCachedUsers();
    if (!cached?.length) return;
    const next = cached.map((u: any) => (u._id === updated._id ? updated : u));
    setCachedUsers(next);
}
function removeUserFromCacheById(id: string) {
    const cached = getCachedUsers();
    if (!cached?.length) return;
    const next = cached.filter((u: any) => u._id !== id);
    setCachedUsers(next);
}

// GET single (optional helper)
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const doc = await repoGetById(params.id);
    if (!doc) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
}

// PUT: update by ObjectId (since mavId is NOT unique anymore)
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    await connectDB();
    try {
        const body = (await req.json()) as Partial<UserClientDAO>;
        const updated = await repoUpdateUserById(params.id, body);

        if (!updated) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        replaceUserInCacheById(updated as any);
        return NextResponse.json(updated);
    } catch (e: any) {
        const msg =
            e?.code === 11000
                ? "Duplicate key error."
                : e?.message || "Failed to update user.";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

// DELETE (optional)
export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    await connectDB();
    try {
        const ok = await repoDeleteUserById(params.id);
        if (!ok) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        removeUserFromCacheById(params.id);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "Failed to delete user." },
            { status: 400 }
        );
    }
}
