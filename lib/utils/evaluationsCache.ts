// lib/utils/evaluationsCache.ts
import type { EvaluationClientDAO } from "@/types/evaluationDao.client";

/**
 * Simple in-memory cache of evaluations, bucketed by userId (string).
 * Stores CLIENT DAOs (ISO strings), not Mongoose docs.
 */

const store = new Map<string, EvaluationClientDAO[]>(); // key = userId

export const getCachedEvaluations = (userId: string): EvaluationClientDAO[] => {
    return store.get(userId) ?? [];
};

export const setCachedEvaluations = (userId: string, evaluations: EvaluationClientDAO[]) => {
    // Keep sorted (newest first by evaluationDate then createdAt)
    const sorted = [...evaluations].sort(compareEvalDesc);
    store.set(userId, sorted);
};

export const addEvaluationToCache = (userId: string, evaluation: EvaluationClientDAO) => {
    const bucket = store.get(userId) ?? [];
    const next = [evaluation, ...bucket];
    next.sort(compareEvalDesc);
    store.set(userId, next);
};

export const updateEvaluationInCache = (userId: string, updated: EvaluationClientDAO) => {
    const bucket = store.get(userId);
    if (!bucket) return;
    const next = bucket.map((e) => (String(e._id) === String(updated._id) ? updated : e));
    next.sort(compareEvalDesc);
    store.set(userId, next);
};

export const deleteEvaluationFromCache = (userId: string, evaluationId: string) => {
    const bucket = store.get(userId);
    if (!bucket) return;
    const next = bucket.filter((e) => String(e._id) !== String(evaluationId));
    store.set(userId, next);
};

// Convenience alias (some routes referenced this name)
export const removeEvaluationFromCache = deleteEvaluationFromCache;

export const clearEvaluationsCache = () => {
    store.clear();
};

// --- helpers ---

function toTime(v?: string | null): number {
    if (!v) return 0;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function compareEvalDesc(a: EvaluationClientDAO, b: EvaluationClientDAO): number {
    const ad = toTime(a.evaluationDate) || toTime(a.createdAt);
    const bd = toTime(b.evaluationDate) || toTime(b.createdAt);
    return bd - ad; // newest first
}
