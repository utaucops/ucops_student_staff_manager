// models/Evaluation.ts (only the changed parts shown)
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IEvaluationItem {
    course: string;
    completed?: boolean | null;
    category: string;
    score?: number | null;
    selfScore?: number | null;
}

const EvaluationItemSchema = new Schema<IEvaluationItem>(
    {
        course: { type: String, trim: true, required: true },
        completed: { type: Boolean, default: null },
        category: { type: String, default: "" },
        score: { type: Number, min: 0, max: 10, default: 0 },
        selfScore: { type: Number, min: 0, max: 10, default: 0 },
    },
    { _id: false }
);

export interface IEvaluation extends Document {
    user: Types.ObjectId;
    year?: number | null;
    evaluationDate: Date;

    cycleLabel?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;

    evaluatorName: string;
    evaluatorEmail: string;
    evaluatorId?: string | null;

    items: IEvaluationItem[];

    employeeComments?: string | null;
    evaluatorComments?: string | null;

    computeOverallScore(): number | null;
    overallScore?: number | null;
}

const EvaluationSchema = new Schema<IEvaluation>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        year: { type: Number, default: new Date().getFullYear() },
        evaluationDate: { type: Date, required: true },

        cycleLabel: { type: String, trim: true, default: null },
        periodStart: { type: Date, default: new Date(`01-01-${new Date().getFullYear()}`) },
        periodEnd: { type: Date, default: new Date(`31-12-${new Date().getFullYear()}`) },

        evaluatorName: { type: String, trim: true, required: true },
        evaluatorEmail: {
            type: String,
            trim: true,
            required: true,
        },
        evaluatorId: { type: String, trim: true, default: null },

        items: { type: [EvaluationItemSchema], default: [] },

        employeeComments: { type: String, default: null },
        evaluatorComments: { type: String, default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// (keep your methods/virtuals/statics/indexes as before)
export default (mongoose.models.Evaluation as mongoose.Model<IEvaluation>) ||
mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
