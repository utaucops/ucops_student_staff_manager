// app/api/users/[id]/metrics/route.ts
import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import User from "@/models/User";
import Metric, { MetricType } from "@/models/Metric";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { metricType, comment } = await req.json();
        await connectDB();

        const metric = await Metric.create({
            metricType: metricType as MetricType,
            comment,
            comment_added_by: "64f12345..." // replace with current user ID from session/auth
        });

        await User.findByIdAndUpdate(params.id, { $push: { merits: metric._id } });

        return NextResponse.json({ success: true, metric });
    } catch (err) {
        return NextResponse.json({ error: "Failed to add metric" }, { status: 500 });
    }
}
