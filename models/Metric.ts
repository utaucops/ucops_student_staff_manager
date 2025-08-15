import mongoose, { Document, Schema, Types } from "mongoose";

export enum MetricType {
    Merit = "merit",
    Demerit = "demerit",
}

export interface IMetric extends Document {
    metricType: MetricType;
    comment: string;
    commenter: string;
    commenterEmail?: string;

    createdAt: Date;
    updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>(
    {
        metricType: { type: String, enum: Object.values(MetricType), required: true },
        comment: { type: String, required: true, trim: true },
        commenter: { type: String, required: true, trim: true },
        commenterEmail: { type: String, trim: true, default: null },
    },
    { timestamps: true }
);

const MetricModel =
    (mongoose.models?.Metric as mongoose.Model<IMetric>) ||
    mongoose.model<IMetric>("Metric", MetricSchema);

export default MetricModel;
