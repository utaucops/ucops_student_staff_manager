import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

import {
    getCachedEvaluations,
    setCachedEvaluations,
    addEvaluationToCache,
} from "@/lib/utils/evaluationsCache";

import {
    repoCreateEvaluationServer,
    repoListEvaluationsByUserServer,
} from "@/lib/repositories/evaluationRepository";

import { serverDAOToClientDAO } from "@/lib/mappers/evaluationMapper";
import type { EvaluationCreateServerDTO } from "@/types/evaluationDao.server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const userId = searchParams.get("userId") ?? "";
        const yearParam = searchParams.get("year");
        const pageParam = Number(searchParams.get("page") || "1");
        const sizeParam = Number(searchParams.get("pageSize") || "10");

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return NextResponse.json({ message: "Invalid or missing userId" }, { status: 400 });
        }

        // sanitize paging
        const pageSize = Math.max(1, Math.min(100, Number.isFinite(sizeParam) ? sizeParam : 10));
        let page = Math.max(1, Number.isFinite(pageParam) ? pageParam : 1);

        // 1) Try cache (client DAOs)
        let bucket = getCachedEvaluations(userId);

        // 2) Hydrate cache once from repo (server DAOs -> client DAOs)
        if (bucket.length === 0) {
            await connectDB();
            const serverDAOs = await repoListEvaluationsByUserServer(userId);
            const clientDAOs = serverDAOs.map(serverDAOToClientDAO);
            setCachedEvaluations(userId, clientDAOs);
            bucket = clientDAOs;
        }

        // 3) Optional year filter (in-memory)
        let filtered = bucket;
        if (yearParam) {
            const y = Number(yearParam);
            if (!Number.isNaN(y)) {
                filtered = filtered.filter((e) => e.year === y);
            }
        }

        // 4) Paging (clamp to last page)
        const total = filtered.length;
        const lastPage = total > 0 ? Math.ceil(total / pageSize) : 1;
        if (page > lastPage) page = lastPage;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageRows = filtered.slice(start, end);

        return NextResponse.json(
            {
                data: pageRows, // client DAOs; dates are ISO strings
                total,
                page,
                pageSize,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("GET /api/users/evaluations error:", err?.message || err);
        return NextResponse.json(
            { message: "Server error", error: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = (await req.json()) as EvaluationCreateServerDTO;

        const { userId, evaluationDate, year, items } = body || ({} as EvaluationCreateServerDTO);

        // Basic required checks
        if (!userId || !evaluationDate || !year || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: "Missing required fields (Payload Invalid - Close the browser and retry)" }, { status: 400 });
        }
        if (!mongoose.isValidObjectId(userId)) {
            return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
        }

        // Optional: ensure user exists (nicer 404)
        const userExists = await User.exists({ _id: userId }).exec();
        if (!userExists) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Create via repository -> server DAO (Date objects)
        const createdServerDAO = await repoCreateEvaluationServer(body);

        // Map to client DAO (ISO strings) for response and cache
        const createdClientDAO = serverDAOToClientDAO(createdServerDAO);

        // Update per-user cache
        addEvaluationToCache(userId, createdClientDAO);

        return NextResponse.json(createdClientDAO, { status: 201 });
    } catch (err: any) {
        console.error("Create evaluation error:", err?.message || err);
        return NextResponse.json(
            { message: err?.message || "Failed to create evaluation" },
            { status: 400 }
        );
    }
}
