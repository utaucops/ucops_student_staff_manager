// types/evaluationDao.server.ts
export type EvalId = string;
export type UserId = string;

export interface EvaluationItemServerDAO {
    course?: string;
    completed?: boolean | null;
    category: string;
    score?: number | null;
    selfScore?: number | null;
}

export interface EvaluationServerDAO {
    _id: EvalId;
    user: UserId;
    year: number | null;                 // can be null
    evaluationDate: Date;

    cycleLabel?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;

    evaluatorName: string;
    evaluatorEmail: string;
    evaluatorId?: string | null;

    items: EvaluationItemServerDAO[];

    employeeComments?: string | null;
    evaluatorComments?: string | null;

    overallScore?: number | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface EvaluationCreateServerDTO {
    userId: UserId;

    evaluationDate: Date | string;
    evaluatorName: string;
    evaluatorEmail: string;

    year?: number | null;
    cycleLabel?: string | null;
    periodStart?: Date | string | null;
    periodEnd?: Date | string | null;
    evaluatorId?: string | null;
    employeeComments?: string | null;
    evaluatorComments?: string | null;

    items: EvaluationItemServerDAO[];
}

export type EvaluationUpdateServerDTO = Partial<EvaluationCreateServerDTO>;
