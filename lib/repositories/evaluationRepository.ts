// lib/repositories/evaluationRepository.ts
import mongoose from "mongoose";
import Evaluation from "@/models/Evaluation";
import {
    evaluationDocToServerDAO,
    serverDAOToClientDAO,
} from "@/lib/mappers/evaluationMapper";
import type {
    EvaluationCreateServerDTO,
    EvaluationUpdateServerDTO,
    EvaluationServerDAO, EvaluationItemServerDAO,
} from "@/types/evaluationDao.server";
import type { EvaluationClientDAO } from "@/types/evaluationDao.client";

function serializeItems(items: EvaluationItemServerDAO[]): EvaluationItemServerDAO[] {
    return items.map((i) => ({
        course: String(i.course).trim(),
        completed: typeof i.completed === "boolean" ? i.completed : null,
        category: typeof i.category === "string" ? i.category.trim() : "",
        score:
            typeof i.score === "number" && !Number.isNaN(i.score) ? i.score : null,
        selfScore:
            typeof i.selfScore === "number" && !Number.isNaN(i.selfScore) ? i.selfScore : null,
    }));
}

/** CREATE (server DAO) — enforce requireds; category -> "" if missing */
export async function repoCreateEvaluationServer(
    input: EvaluationCreateServerDTO
): Promise<EvaluationServerDAO> {
    if (!mongoose.isValidObjectId(input.userId)) throw new Error("Invalid userId");

    // required validations
    if (!input.evaluationDate) throw new Error("evaluationDate is required");
    if (!input.evaluatorName || !input.evaluatorName.trim()) throw new Error("evaluatorName is required");
    if (!input.evaluatorEmail || !input.evaluatorEmail.trim()) throw new Error("evaluatorEmail is required");
    if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("At least one item is required");
    for (const it of input.items) {
        if (!it.course || !String(it.course).trim()) throw new Error("Each item must include a non-empty course");
    }

    const created = await Evaluation.create({
        user: input.userId,
        year: typeof input.year === "number" ? input.year : null,       // nullable
        evaluationDate: new Date(input.evaluationDate),

        cycleLabel: input.cycleLabel ?? null,
        periodStart: input.periodStart ? new Date(input.periodStart) : null,
        periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,

        evaluatorName: input.evaluatorName.trim(),
        evaluatorEmail: input.evaluatorEmail.trim(),
        evaluatorId: input.evaluatorId ?? null,

        items: serializeItems(input.items),

        employeeComments: input.employeeComments ?? null,
        evaluatorComments: input.evaluatorComments ?? null,
    });

    const lean = await Evaluation.findById(created._id).lean({ virtuals: true }).exec();
    return evaluationDocToServerDAO(lean!);
}

/** UPDATE (server DAO) — keep category default "", don't derive */
export async function repoUpdateEvaluationServer(
    evaluationId: string,
    patch: EvaluationUpdateServerDTO
): Promise<EvaluationServerDAO | null> {
    if (!mongoose.isValidObjectId(evaluationId)) throw new Error("Invalid evaluationId");

    const update: any = {};

    if ("evaluationDate" in patch) {
        update.evaluationDate = patch.evaluationDate ? new Date(patch.evaluationDate) : undefined;
    }
    if ("year" in patch) {
        update.year = typeof patch.year === "number" ? patch.year : null;
    }
    if ("cycleLabel" in patch) update.cycleLabel = patch.cycleLabel ?? null;
    if ("periodStart" in patch) update.periodStart = patch.periodStart ? new Date(patch.periodStart) : null;
    if ("periodEnd" in patch) update.periodEnd = patch.periodEnd ? new Date(patch.periodEnd) : null;

    if ("evaluatorName" in patch) update.evaluatorName = (patch.evaluatorName ?? "").trim();
    if ("evaluatorEmail" in patch) update.evaluatorEmail = (patch.evaluatorEmail ?? "").trim();
    if ("evaluatorId" in patch) update.evaluatorId = patch.evaluatorId ?? null;

    if ("employeeComments" in patch) update.employeeComments = patch.employeeComments ?? null;
    if ("evaluatorComments" in patch) update.evaluatorComments = patch.evaluatorComments ?? null;

    if ("items" in patch && Array.isArray(patch.items)) {
        // maintain course (UI keeps it read-only) but we still accept it if sent
        for (const it of patch.items) {
            if (!it.course || !String(it.course).trim()) {
                throw new Error("Each item must include a non-empty course");
            }
        }
        update.items = serializeItems(patch.items);
    }

    const updated = await Evaluation.findByIdAndUpdate(evaluationId, update, {
        new: true,
        runValidators: true,
    })
        .lean({ virtuals: true })
        .exec();

    return updated ? evaluationDocToServerDAO(updated) : null;
}

export async function repoDeleteEvaluationServer(evaluationId: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(evaluationId)) throw new Error("Invalid evaluationId");
    const res = await Evaluation.deleteOne({ _id: evaluationId }).exec();
    return res.deletedCount === 1;
}

export async function repoFindEvaluationByIdServer(
    evaluationId: string
): Promise<EvaluationServerDAO | null> {
    if (!mongoose.isValidObjectId(evaluationId)) throw new Error("Invalid evaluationId");
    const doc = await Evaluation.findById(evaluationId).lean({ virtuals: true }).exec();
    return doc ? evaluationDocToServerDAO(doc) : null;
}

/* ===== Client DAO wrappers ===== */

export async function repoCreateEvaluation(input: EvaluationCreateServerDTO): Promise<EvaluationClientDAO> {
    const s = await repoCreateEvaluationServer(input);
    return serverDAOToClientDAO(s);
}
export async function repoUpdateEvaluation(
    evaluationId: string,
    patch: EvaluationUpdateServerDTO
): Promise<EvaluationClientDAO | null> {
    const s = await repoUpdateEvaluationServer(evaluationId, patch);
    return s ? serverDAOToClientDAO(s) : null;
}
export async function repoDeleteEvaluation(evaluationId: string): Promise<boolean> {
    return repoDeleteEvaluationServer(evaluationId);
}
export async function repoFindEvaluationById(evaluationId: string): Promise<EvaluationClientDAO | null> {
    const s = await repoFindEvaluationByIdServer(evaluationId);
    return s ? serverDAOToClientDAO(s) : null;
}
export async function repoListEvaluationsByUser(
    userId: string,
    opts?: { year?: number }
): Promise<EvaluationClientDAO[]> {
    const s = await (await import("./evaluationRepository")).repoListEvaluationsByUserServer(userId, opts);
    return s.map(serverDAOToClientDAO);
}

export async function repoListEvaluationsByUserServer(
    userId: string,
    opts?: { year?: number }
): Promise<EvaluationServerDAO[]> {
    if (!mongoose.isValidObjectId(userId)) throw new Error("Invalid userId");

    const query: any = { user: userId };
    if (typeof opts?.year === "number") {
        query.year = opts.year;
    }

    const docs = await Evaluation.find(query)
        .sort({ evaluationDate: -1, createdAt: -1 })
        .lean({ virtuals: true })
        .exec();

    return docs.map(evaluationDocToServerDAO);
}