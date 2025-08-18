// app/api/users/evaluations/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
    updateEvaluationInCache,
    removeEvaluationFromCache,
} from "@/lib/utils/evaluationsCache";
import {
    repoUpdateEvaluation,
    repoDeleteEvaluation,
    repoFindEvaluationById,
} from "@/lib/repositories/evaluationRepository";
import type { EvaluationUpdateServerDTO } from "@/types/evaluationDao.server";

// In Next 15, Route Handler context has params as a Promise
type RouteContext = { params: Promise<{ id: string }> };

function toStringId(v: unknown): string | null {
    if (!v) return null;
    if (typeof v === "string") return v;
    // Mongoose ObjectId or similar
    return v?.toString?.() ?? null;
}

// PUT /api/users/evaluations/:id
export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid evaluation ID" }, { status: 400 });
        }

        const body = (await req.json()) as EvaluationUpdateServerDTO;

        await connectDB();

        // Optional: ensure the evaluation exists before update
        const existing = await repoFindEvaluationById(id);
        if (!existing) {
            return NextResponse.json({ message: "Evaluation not found" }, { status: 404 });
        }

        const updatedDAO = await repoUpdateEvaluation(id, body);

        // Keep cache in sync
        const userId = toStringId(updatedDAO?.user);
        if (userId) {
            updateEvaluationInCache(userId, updatedDAO as any);
        }

        return NextResponse.json(updatedDAO, { status: 200 });
    } catch (err) {
        // avoid referencing params in catch (scope + type safety)
        console.error("PUT /api/users/evaluations/[id] error:", err);
        return NextResponse.json(
            { message: "Failed to update evaluation" },
            { status: 500 }
        );
    }
}

// DELETE /api/users/evaluations/:id
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid evaluation ID" }, { status: 400 });
        }

        await connectDB();

        const existing = await repoFindEvaluationById(id);
        if (!existing) {
            return NextResponse.json({ message: "Evaluation not found" }, { status: 404 });
        }

        await repoDeleteEvaluation(id);

        // Remove from cache
        const userId = toStringId(existing.user);
        if (userId) {
            removeEvaluationFromCache(userId, id);
        }

        return NextResponse.json({ message: "Evaluation deleted" }, { status: 200 });
    } catch (err) {
        console.error("DELETE /api/users/evaluations/[id] error:", err);
        return NextResponse.json(
            { message: "Failed to delete evaluation" },
            { status: 500 }
        );
    }
}
