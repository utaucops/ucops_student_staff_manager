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

// PUT /api/users/evaluations/:id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

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
        if (updatedDAO?.user) {
            updateEvaluationInCache(updatedDAO.user.toString(), updatedDAO);
        }

        return NextResponse.json(updatedDAO, { status: 200 });
    } catch (err) {
        console.error(`PUT /api/users/evaluations/${params.id} error:`, err);
        return NextResponse.json({ message: "Failed to update evaluation", error: err }, { status: 500 });
    }
}

// DELETE /api/users/evaluations/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

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
        if (existing.user) {
            removeEvaluationFromCache(existing.user.toString(), id);
        }

        return NextResponse.json({ message: "Evaluation deleted" }, { status: 200 });
    } catch (err) {
        console.error(`DELETE /api/users/evaluations/${params.id} error:`, err);
        return NextResponse.json({ message: "Failed to delete evaluation", error: err }, { status: 500 });
    }
}
