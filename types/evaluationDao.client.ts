// types/evaluationDao.client.ts

export interface EvaluationItemClientDAO {
    course: string;
    completed?: boolean | null;
    category: string;
    score?: number | null;
    selfScore?: number | null;
}

export interface EvaluationClientDAO {
    _id: string;
    user: string;

    year: number | null;
    evaluationDate: string;

    cycleLabel?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;

    evaluatorName: string;
    evaluatorEmail: string;
    evaluatorId?: string | null;

    items: EvaluationItemClientDAO[];

    employeeComments?: string | null;
    evaluatorComments?: string | null;

    overallScore?: number | null;

    createdAt: string;
    updatedAt: string;
}
