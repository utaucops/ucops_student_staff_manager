"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShadcnDatePicker } from "@/components/shared/ShadcnDatePicker";

// ✅ Client DAO types
import type {
    EvaluationClientDAO,
    EvaluationItemClientDAO,
} from "@/types/evaluationDao.client";

function toDateOrUndefined(v?: string | Date | null) {
    if (!v) return undefined;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

type FormValues = {
    year: number | null;
    evaluationDate?: Date;
    cycleLabel: string;
    periodStart?: Date;
    periodEnd?: Date;
    evaluatorName: string;   // required
    evaluatorEmail: string;  // required
    evaluatorId?: string | null;
    employeeComments?: string | null;
    evaluatorComments?: string | null;
    items: Array<{
        course: string;                 // required
        completed?: boolean | null;
        category: string;
        score?: number | null;
        selfScore?: number | null;
    }>;
};

export default function EvaluationDetailsDialog({
                                                    open,
                                                    onOpenChange,
                                                    evaluation,
                                                    onSaved,
                                                    onDeleted,
                                                    onClose,
                                                }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    evaluation: EvaluationClientDAO;
    onSaved?: (updated: EvaluationClientDAO) => void;
    onDeleted?: () => void;
    onClose?: () => void;
}) {
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const form = useForm<FormValues>({
        defaultValues: {
            year: evaluation.year, // number | null
            evaluationDate: toDateOrUndefined(evaluation.evaluationDate),
            cycleLabel: evaluation.cycleLabel ?? "",
            periodStart: toDateOrUndefined(evaluation.periodStart ?? undefined),
            periodEnd: toDateOrUndefined(evaluation.periodEnd ?? undefined),
            evaluatorName: evaluation.evaluatorName,   // required on server
            evaluatorEmail: evaluation.evaluatorEmail, // required on server
            evaluatorId: evaluation.evaluatorId ?? "",
            employeeComments: evaluation.employeeComments ?? "",
            evaluatorComments: evaluation.evaluatorComments ?? "",
            items: evaluation.items.map((i) => ({
                course: i.course, // required
                completed: i.completed ?? null,
                category: i.category ?? "",
                score: i.score ?? null,
                selfScore: i.selfScore ?? null,
            })),
        },
    });

    // Sync "year" when evaluationDate changes
    const evalDateWatch = form.watch("evaluationDate");
    React.useEffect(() => {
        if (evalDateWatch instanceof Date && !Number.isNaN(evalDateWatch.getTime())) {
            form.setValue("year", evalDateWatch.getFullYear());
        }
    }, [evalDateWatch, form]);

    async function handleSave(values: FormValues) {
        setSaving(true);
        try {
            // Convert dates to YYYY-MM-DD strings for server (DAO stores ISO strings)
            const payload = {
                year: values.year, // number | null
                evaluationDate: values.evaluationDate
                    ? format(values.evaluationDate, "yyyy-MM-dd")
                    : evaluation.evaluationDate, // keep original if unchanged
                cycleLabel: values.cycleLabel || "",
                periodStart: values.periodStart ? format(values.periodStart, "yyyy-MM-dd") : null,
                periodEnd: values.periodEnd ? format(values.periodEnd, "yyyy-MM-dd") : null,
                evaluatorName: values.evaluatorName,   // required
                evaluatorEmail: values.evaluatorEmail, // required
                evaluatorId: values.evaluatorId ?? "",
                employeeComments: values.employeeComments ?? "",
                evaluatorComments: values.evaluatorComments ?? "",
                items: (values.items || []).map((i) => ({
                    course: i.course, // required
                    completed: typeof i.completed === "string" ? (
                        i.completed === "" || i.completed == null
                            ? null
                            : i.completed === "true"
                                ? true
                                : i.completed === "false"
                                    ? false
                                    : null
                    ) : (
                        i.completed === undefined ? null : i.completed
                    ),
                    category: i.category || "",
                    score: typeof i.score === "string" ? (i.score === "" ? 0 : parseInt(i.score)) : Number(i.score),
                    selfScore: typeof i.selfScore === "string" ? (i.selfScore === "" ? 0 : parseInt(i.selfScore)) : Number(i.selfScore),
                })) as EvaluationItemClientDAO[],
            };

            const res = await fetch(`/api/users/evaluations/${evaluation._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "Failed to save evaluation");
            }
            const updated = (await res.json()) as EvaluationClientDAO;
            toast.success("Evaluation updated");
            setEditing(false);
            onSaved?.(updated);
        } catch (e: any) {
            toast.error(e?.message ?? "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this evaluation? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/users/evaluations/${evaluation._id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "Failed to delete evaluation");
            }
            toast.success("Evaluation deleted");
            onDeleted?.();
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e?.message ?? "Delete failed");
        } finally {
            setDeleting(false);
        }
    }

    const items = form.watch("items") || [];
    const fmt = (d?: string | Date | null) => (d ? format(new Date(d), "yyyy-MM-dd") : "—");

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) onClose?.();
            }}
        >
            <DialogContent className="sm:max-w-[1100px] p-0">
                <div className="max-h-[78vh] overflow-y-auto p-6">
                    <DialogHeader className="px-0">
                        <DialogTitle>
                            Evaluation • {fmt(evaluation.evaluationDate)}{" "}
                            {evaluation.cycleLabel ? `• ${evaluation.cycleLabel}` : ""}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Meta + controls */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                            Created: {fmt(evaluation.createdAt)} • Updated: {fmt(evaluation.updatedAt)}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            {!editing ? (
                                <Button onClick={() => setEditing(true)}>Edit</Button>
                            ) : (
                                <Button onClick={form.handleSubmit(handleSave)} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            )}
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>

                    {/* Form body */}
                    <form className="mt-6 space-y-6">
                        {/* General info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Evaluation Date</Label>
                                <Controller
                                    control={form.control}
                                    name="evaluationDate"
                                    render={({ field }) => (
                                        <ShadcnDatePicker
                                            value={field.value}
                                            onChange={editing ? field.onChange : () => {}}
                                            placeholder="Select date"
                                            disabled={!editing}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <Label>Year</Label>
                                <Input
                                    type="number"
                                    {...form.register("year", {
                                        setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                                    })}
                                    disabled={!editing}
                                />
                            </div>

                            <div>
                                <Label>Cycle Label</Label>
                                <Input
                                    placeholder="e.g., Spring #1, Annual"
                                    {...form.register("cycleLabel")}
                                    disabled={!editing}
                                />
                            </div>

                            <div>
                                <Label>Period Start</Label>
                                <Controller
                                    control={form.control}
                                    name="periodStart"
                                    render={({ field }) => (
                                        <ShadcnDatePicker
                                            value={field.value ?? undefined}
                                            onChange={editing ? field.onChange : () => {}}
                                            placeholder="Start date"
                                            disabled={!editing}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <Label>Period End</Label>
                                <Controller
                                    control={form.control}
                                    name="periodEnd"
                                    render={({ field }) => (
                                        <ShadcnDatePicker
                                            value={field.value ?? undefined}
                                            onChange={editing ? field.onChange : () => {}}
                                            placeholder="End date"
                                            disabled={!editing}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <Label>Evaluator Name</Label>
                                <Input {...form.register("evaluatorName", { required: true })} disabled={!editing} />
                            </div>

                            <div>
                                <Label>Evaluator Email</Label>
                                <Input type="email" {...form.register("evaluatorEmail", { required: true })} disabled={!editing} />
                            </div>

                            <div>
                                <Label>Evaluator ID</Label>
                                <Input {...form.register("evaluatorId")} disabled={!editing} />
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Employee Comments</Label>
                                <textarea
                                    className="w-full border rounded p-2 min-h-[100px]"
                                    {...form.register("employeeComments")}
                                    disabled={!editing}
                                />
                            </div>
                            <div>
                                <Label>Evaluator Comments</Label>
                                <textarea
                                    className="w-full border rounded p-2 min-h-[100px]"
                                    {...form.register("evaluatorComments")}
                                    disabled={!editing}
                                />
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <div className="mb-2 font-medium">Items</div>
                            <div className="overflow-x-auto border rounded">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="bg-muted/30">
                                        <th className="p-2 border text-left">Course</th>
                                        <th className="p-2 border text-left">Completed</th>
                                        <th className="p-2 border text-left">Category</th>
                                        <th className="p-2 border text-left">Score</th>
                                        <th className="p-2 border text-left">Self Score</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td className="p-3 text-center" colSpan={5}>
                                                No items.
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((i: EvaluationItemClientDAO, idx: number) => (
                                        <tr key={idx}>
                                            <td className="p-2 border">
                                                <Input
                                                    {...form.register(`items.${idx}.course` as const, { required: true })}
                                                    defaultValue={i.course}
                                                    disabled={!editing}
                                                />
                                            </td>

                                            <td className="p-2 border">
                                                <select
                                                    className="border rounded h-9 w-full px-2"
                                                    {...form.register(`items.${idx}.completed` as const, {
                                                        setValueAs: (v) =>
                                                            v === "" || v == null
                                                                ? null
                                                                : v === true || v === "true"
                                                                    ? true
                                                                    : v === false || v === "false"
                                                                        ? false
                                                                        : null,
                                                    })}
                                                    defaultValue={i.completed === null ? "" : i.completed ? "true" : "false"}
                                                    disabled={!editing}
                                                >
                                                    <option value="">—</option>
                                                    <option value="true">Y</option>
                                                    <option value="false">N</option>
                                                </select>
                                            </td>

                                            <td className="p-2 border">
                                                <Input
                                                    {...form.register(`items.${idx}.category` as const)}
                                                    defaultValue={i.category ?? ""}
                                                    disabled={!editing}
                                                />
                                            </td>

                                            <td className="p-2 border">
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    min={0}
                                                    max={10}
                                                    {...form.register(`items.${idx}.score` as const, {
                                                        setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                                                    })}
                                                    defaultValue={i.score ?? undefined}
                                                    disabled={!editing}
                                                />
                                            </td>

                                            <td className="p-2 border">
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    min={0}
                                                    max={10}
                                                    {...form.register(`items.${idx}.selfScore` as const, {
                                                        setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                                                    })}
                                                    defaultValue={i.selfScore ?? undefined}
                                                    disabled={!editing}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-6 py-4">
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        {!editing ? (
                            <Button onClick={() => setEditing(true)}>Edit</Button>
                        ) : (
                            <Button onClick={form.handleSubmit(handleSave)} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        )}
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
