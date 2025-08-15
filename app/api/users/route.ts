// app/api/users/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
    createUser as repoCreateUser, // from your userRepository
} from "@/lib/repositories/userRepository";

import {
    getCachedUsers,
    setCachedUsers,
    addUserToCache,
} from "@/lib/utils/userCache";

import type { UserClientDAO } from "@/types/userDao.client";

// GET: serve from cache; hydrate cache once from DB (lean + virtuals)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const positionFilter = (searchParams.get("positionFilter") || "");
    const roleFilters = positionFilter !== "" ? positionFilter.split(",") : [];
    const statusFilterParam = (searchParams.get("statusFilter") || "").trim().toLowerCase();
    const statusFilters = statusFilterParam !== "" ? statusFilterParam.split(",") : [];

    console.log(roleFilters);
    console.log(statusFilters);

    // 1) Try cache
    let users = getCachedUsers();

    // 2) If cache is empty, hydrate from DB once
    if (users.length === 0) {
        await connectDB();
        const docs = await User.find()
            .sort({ createdAt: -1 })
            .lean({ virtuals: true })
            .exec();

        setCachedUsers(docs as any);
        users = docs as any;
    }

    // 3) In-memory filter
    const filtered = search
        ? users.filter((u) => {
            const lookup = (v: unknown) =>
                typeof v === "string" ? v : v == null ? "" : String(v);
            return (
                lookup(u.firstName).toLowerCase().includes(search) ||
                lookup(u.lastName).toLowerCase().includes(search) ||
                lookup(u.studentEmail).toLowerCase().includes(search) ||
                lookup(u.workEmail).toLowerCase().includes(search) ||
                lookup(u.mavId).toLowerCase() === search
            );
        })
        : users;

    const roleFiltered = roleFilters.length > 0
        ? filtered.filter((u) => {
        return (u.rolePosition && roleFilters.includes(u.rolePosition));
    }) : filtered;

    const statusFiltered = statusFilters.length > 0
        ? roleFiltered.filter((u) => {
            return (u.status && statusFilters.includes(u.status.toLowerCase()));
        }) : roleFiltered;

    return NextResponse.json(statusFiltered);
}

// POST: create via repo, then push the created user into cache
export async function POST(req: Request) {
    await connectDB();
    try {
        // All fields are optional/nullable now; accept Partial DAO
        const body = (await req.json()) as Partial<UserClientDAO>;

        // Create (repo maps/validates enums & dates; nothing is "required" here)
        const created = await repoCreateUser(body);

        // Update cache
        addUserToCache(created as any);

        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        // generic duplicate key guard (in case other indexes exist)
        const msg =
            e?.code === 11000
                ? "Duplicate key error."
                : e?.message || "Failed to create user.";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
