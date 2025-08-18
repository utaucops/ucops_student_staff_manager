// app/api/users/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
    getById as repoGetById,
    updateUserById as repoUpdateUserById,
    deleteUserById as repoDeleteUserById,
} from "@/lib/repositories/userRepository";
import { getCachedUsers, setCachedUsers } from "@/lib/utils/userCache";
import type { UserClientDAO } from "@/types/userDao.client";

// In Next 15, Route Handler context has params as a Promise
type RouteContext = { params: Promise<{ id: string }> };

function replaceUserInCacheById(updated: UserClientDAO) {
    const cached = getCachedUsers();
    if (!cached?.length) return;
    const next = cached.map((u) => (u._id === updated._id ? updated : u));
    setCachedUsers(next as any);
}

function removeUserFromCacheById(id: string) {
    const cached = getCachedUsers();
    if (!cached?.length) return;
    const next = cached.filter((u) => u._id !== id);
    setCachedUsers(next);
}

// GET single
export async function GET(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    await connectDB();
    const doc = await repoGetById(id);
    if (!doc) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
}

// PUT: update by ObjectId (since mavId is NOT unique anymore)
export async function PUT(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    await connectDB();
    try {
        const body = (await req.json()) as Partial<UserClientDAO>;
        const updated = await repoUpdateUserById(id, body);

        if (!updated) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        replaceUserInCacheById(updated as UserClientDAO);
        return NextResponse.json(updated);
    } catch (e: unknown) {
        const err = e as { code?: number; message?: string };
        const msg =
            err?.code === 11000
                ? "Duplicate key error."
                : err?.message || "Failed to update user.";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const { id } = await params;
    await connectDB();
    try {
        const ok = await repoDeleteUserById(id);
        if (!ok) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        removeUserFromCacheById(id);
        return NextResponse.json({ ok: true });
    } catch (e: unknown) {
        const err = e as { message?: string };
        return NextResponse.json(
            { error: err?.message || "Failed to delete user." },
            { status: 400 }
        );
    }
}
