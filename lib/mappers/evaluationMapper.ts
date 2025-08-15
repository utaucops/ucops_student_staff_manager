// lib/mappers/evaluationMappers.ts
import type { IEvaluation } from "@/models/Evaluation";
import type * as S from "@/types/evaluationDao.server";
import type * as C from "@/types/evaluationDao.client";

function toDate(v: Date | string | null | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function deriveCategory(course?: string | null): string {
    if (!course) return "GENERAL";
    const left = course.split(":")[0]?.trim();
    const token = left?.split(/\s+/)[0]?.trim();
    return token ? token.toUpperCase() : "GENERAL";
}

/** Mongoose doc/plain -> Server DAO (Dates) */
export function evaluationDocToServerDAO(doc: IEvaluation | any): S.EvaluationServerDAO {
    const id = doc._id?.toString?.() ?? String(doc._id);

    return {
        _id: id,
        user: doc.user?.toString?.() ?? String(doc.user),
        year: doc.year ?? null, // allow null
        evaluationDate: new Date(doc.evaluationDate),

        cycleLabel: doc.cycleLabel ?? null,
        periodStart: toDate(doc.periodStart),
        periodEnd: toDate(doc.periodEnd),

        evaluatorName: doc.evaluatorName ?? null,
        evaluatorEmail: doc.evaluatorEmail ?? null,
        evaluatorId: doc.evaluatorId ?? null,

        items: (doc.items || []).map((i: any) => ({
            course: typeof i.course === "string" ? i.course : null,
            completed: typeof i.completed === "boolean" ? i.completed : null,
            category: typeof i.category === "string" ? i.category : "",
            score: typeof i.score === "number" ? i.score : null,
            selfScore: typeof i.selfScore === "number" ? i.selfScore : null,
        })),

        employeeComments: doc.employeeComments ?? null,
        evaluatorComments: doc.evaluatorComments ?? null,

        overallScore: typeof doc.overallScore === "number" ? doc.overallScore : null,

        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
    };
}

/** Server DAO (Dates) -> Client DAO (ISO strings) */
export function serverDAOToClientDAO(s: S.EvaluationServerDAO): C.EvaluationClientDAO {
    const iso = (d?: Date | null) => (d ? d.toISOString() : null);

    return {
        _id: s._id,
        user: s.user,

        year: s.year ?? null,
        evaluationDate: s.evaluationDate.toISOString(),

        cycleLabel: s.cycleLabel ?? null,
        periodStart: iso(s.periodStart),
        periodEnd: iso(s.periodEnd),

        // client requires strings here
        evaluatorName: s.evaluatorName ?? "",
        evaluatorEmail: s.evaluatorEmail ?? "",
        evaluatorId: s.evaluatorId ?? null,

        items: s.items.map((i) => ({
            // client requires non-null string
            course: i.course ?? "",
            completed: i.completed ?? null,
            // always a string; server defaults to ""
            category: i.category ?? "",
            score: i.score ?? null,
            selfScore: i.selfScore ?? null,
        })),

        employeeComments: s.employeeComments ?? null,
        evaluatorComments: s.evaluatorComments ?? null,

        overallScore: s.overallScore ?? null,

        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    };
}
