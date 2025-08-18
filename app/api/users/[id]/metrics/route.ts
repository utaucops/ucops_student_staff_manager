// app/api/users/[id]/metrics/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Metric, { MetricType } from "@/models/Metric";
import metric from "@/models/Metric";

// If you run on Node.js runtime explicitly (optional):
// export const runtime = "nodejs";

export async function POST(req: Request, context: any) {
    const { params } = context;               // avoid strict typing issues
    if (params) {
        const { id } = params as { id: string };

        try {
            const { metricType, comment } = await req.json();

            if (!id) {
                return NextResponse.json({ error: "Missing user id" }, { status: 400 });
            }
            if (!comment || !metricType) {
                return NextResponse.json({ error: "metricType and comment are required" }, { status: 400 });
            }
            if (![MetricType.Merit, MetricType.Demerit].includes(metricType)) {
                return NextResponse.json({ error: "Invalid metricType" }, { status: 400 });
            }

            await connectDB();

            const metric = await Metric.create({
                metricType,
                comment,
                // TODO: replace with the authenticated user's id from your session
                comment_added_by: /* currentUserId */ id, // placeholder; use your auth value
            });

            const pushField = metricType === MetricType.Merit ? "merits" : "demerits";
            await User.findByIdAndUpdate(id, { $push: { [pushField]: metric._id } });

            return NextResponse.json({ success: true, metric }, { status: 201 });
        } catch (err) {
            console.error("POST /users/[id]/metrics error:", err);
            return NextResponse.json({ error: "Failed to add metric" }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Failed to add metric" }, { status: 500 });
}
