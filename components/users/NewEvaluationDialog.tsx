"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ShadcnDatePicker } from "@/components/shared/ShadcnDatePicker";

// Local fixed list of course names from CSV
const COURSES = [
    "SAFETY 101: General Safety",
    "SETUP 101: Cable Wrapping",
    "SETUP 102: Stage Building - Rio",
    "SETUP 103: Furnishings Setup",
    "SETUP 104: Room Knowledge",
    "SETUP 105: Event Support",
    "SETUP 106: Stage Building - Bluebonnet",
    "SETUP 107: Audio",
    "SETUP 108: Video",
    "SETUP 109: Lighting",
    "SETUP 110: Projection",
    "SETUP 111: Pipe & Drape",
    "SETUP 112: Building Diagrams",
    "SETUP 113: Stage Building - Carlisle",
    "SETUP 114: Maintenance",
    "SETUP 115: Stage Building - Rosebud",
    "SETUP 116: Equipment Checkout",
    "SETUP 117: Customer Service",
    "SETUP 118: Event Notes",
    "SETUP 119: Scheduling",
    "SETUP 120: Conflict Management",
    "SETUP 121: Building Access",
    "SETUP 122: Event Cleanup",
    "SETUP 123: Stage Building - San Saba",
    "SETUP 124: Audio Troubleshooting",
    "SETUP 125: Lighting Troubleshooting",
    "SETUP 126: Video Troubleshooting",
    "SETUP 127: Projection Troubleshooting",
    "SETUP 128: Stage Building - Red River",
    "SETUP 129: Event Reporting",
    "SETUP 130: Time Management",
    "SETUP 131: Stage Building - Guadalupe",
    "SETUP 132: Stage Building - Pecos",
    "SETUP 133: Team Leadership",
    "SETUP 134: Safety Equipment Use",
    "SETUP 135: Event Layout",
    "SETUP 136: Stage Building - Lone Star",
    "SETUP 137: Stage Building - Pedernales",
    "SETUP 138: Emergency Procedures",
    "SETUP 139: Customer Feedback",
    "SETUP 140: Equipment Storage",
    "SETUP 141: Stage Building - Rio Grande",
    "SETUP 142: Venue Transitions",
    "SETUP 143: Inventory Management",
    "SETUP 144: Special Event Coordination",
    "SETUP 145: New Hire Training",
    "SETUP 146: Multi-room Coordination",
    "SETUP 147: Outdoor Event Setup",
    "SETUP 148: Stage Building - Ballroom",
    "SETUP 149: Vendor Coordination",
    "SETUP 150: Technical Documentation",
    "SETUP 151: Final Walkthrough",
] as const;

// --- Schema: use Date objects for date fields (since ShadcnDatePicker returns Date) ---
const itemSchema = z.object({
    course: z.string().min(1),
    completed: z.boolean().optional().nullable(),
    category: z.string().optional(),
    score: z.number().min(0).max(10).optional(),
    selfScore: z.number().min(0).max(10).optional(),
});

const formSchema = z.object({
    userId: z.string().min(1),
    evaluationDate: z.date(), // <- Date
    year: z.number().int().min(2000).max(3000),
    cycleLabel: z.string().optional(),
    periodStart: z.date().optional().nullable(),
    periodEnd: z.date().optional().nullable(),
    evaluatorName: z.string().optional(),
    evaluatorEmail: z.string().email().optional().or(z.literal("")).optional(),
    evaluatorId: z.string().optional(),
    employeeComments: z.string().optional(),
    evaluatorComments: z.string().optional(),
    items: z.array(itemSchema).min(1),
});

export type NewEvaluationForm = z.infer<typeof formSchema>;

export default function NewEvaluationDialog({
                                                userId,
                                                trigger,
                                                onCreated,
                                            }: {
    userId: string;
    trigger?: React.ReactNode;
    onCreated?: () => void;
}) {
    const [open, setOpen] = React.useState(false);

    const today = new Date();

    const form = useForm<NewEvaluationForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId,
            evaluationDate: today,
            year: today.getFullYear(),
            cycleLabel: "",
            periodStart: undefined,
            periodEnd: undefined,
            evaluatorName: "",
            evaluatorEmail: "",
            evaluatorId: "",
            employeeComments: "",
            evaluatorComments: "",
            items: COURSES.map((course) => ({
                course,
                completed: null,
                category: "",
                score: undefined,
                selfScore: undefined,
            })),
        },
    });

    const { register, handleSubmit, setValue, watch, control } = form;
    const evaluationDate = watch("evaluationDate");

    // Keep "year" in sync with selected evaluationDate
    React.useEffect(() => {
        if (evaluationDate instanceof Date && !Number.isNaN(evaluationDate.getTime())) {
            setValue("year", evaluationDate.getFullYear());
        }
    }, [evaluationDate, setValue]);

    const onSubmit = async (values: NewEvaluationForm) => {
        try {
            // Convert Dates to strings for the API
            const payload = {
                ...values,
                evaluationDate: format(values.evaluationDate, "yyyy-MM-dd"),
                periodStart: values.periodStart ? format(values.periodStart, "yyyy-MM-dd") : "",
                periodEnd: values.periodEnd ? format(values.periodEnd, "yyyy-MM-dd") : "",
            };

            const res = await fetch("/api/users/evaluations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());

            setOpen(false);
            onCreated?.();
        } catch (e: any) {
            toast.error(`Failed to create evaluation: ${e?.message ?? e}`);
        }
    };

    const items = watch("items") || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? <Button variant="default">Add Evaluation</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>New Evaluation</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
                >
                    <input type="hidden" {...register("userId")} value={userId} />

                    {/* General info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <Label>Evaluation Date</Label>
                            <Controller
                                control={control}
                                name="evaluationDate"
                                render={({ field }) => (
                                    <ShadcnDatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select date"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label>Year</Label>
                            <Input type="number" {...register("year", { valueAsNumber: true })} />
                        </div>
                        <div>
                            <Label>Cycle Label</Label>
                            <Input placeholder="e.g., Spring #1, Annual" {...register("cycleLabel")} />
                        </div>

                        <div>
                            <Label>Period Start</Label>
                            <Controller
                                control={control}
                                name="periodStart"
                                render={({ field }) => (
                                    <ShadcnDatePicker
                                        value={field.value ?? undefined}
                                        onChange={field.onChange}
                                        placeholder="Start date (optional)"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label>Period End</Label>
                            <Controller
                                control={control}
                                name="periodEnd"
                                render={({ field }) => (
                                    <ShadcnDatePicker
                                        value={field.value ?? undefined}
                                        onChange={field.onChange}
                                        placeholder="End date (optional)"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <Label>Evaluator Name</Label>
                            <Input {...register("evaluatorName")} />
                        </div>
                        <div>
                            <Label>Evaluator Email</Label>
                            <Input type="email" {...register("evaluatorEmail")} />
                        </div>
                        <div>
                            <Label>Evaluator ID</Label>
                            <Input {...register("evaluatorId")} />
                        </div>
                    </div>

                    {/* Course list */}
                    <div className="overflow-x-auto border rounded">
                        <table className="w-full text-sm table-auto">
                            <thead>
                            <tr className="bg-muted/30">
                                <th className="p-2 border text-left w-[150px]">Course</th>
                                <th className="p-2 border text-left w-2">Completed (Y/N)</th>
                                <th className="p-2 border text-left w-3">Category</th>
                                <th className="p-2 border text-left w-3">Score</th>
                                <th className="p-2 border text-left w-3">Self Score</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-2 border">
                                        <Input value={item.course} readOnly />
                                        <input
                                            type="hidden"
                                            {...form.register(`items.${idx}.course`)}
                                            value={item.course}
                                        />
                                    </td>
                                    <td className="p-2 border">
                                        <select
                                            className="border rounded h-9 w-full px-2"
                                            {...form.register(`items.${idx}.completed`, {
                                                setValueAs: (v) =>
                                                    v === ""
                                                        ? null
                                                        : v === "true"
                                                            ? true
                                                            : v === "false"
                                                                ? false
                                                                : null,
                                            })}
                                            defaultValue=""
                                        >
                                            <option value="">—</option>
                                            <option value="true">Y</option>
                                            <option value="false">N</option>
                                        </select>
                                    </td>
                                    <td className="p-2 border">
                                        <Input {...form.register(`items.${idx}.category`)} />
                                    </td>
                                    <td className="p-2 border">
                                        <Input
                                            type="number"
                                            step="1"
                                            min={0}
                                            max={10}
                                            {...form.register(`items.${idx}.score`, {
                                                setValueAs: (v) =>
                                                    v === "" || v === null ? undefined : Number(v),
                                            })}
                                        />
                                    </td>
                                    <td className="p-2 border">
                                        <Input
                                            type="number"
                                            step="1"
                                            min={0}
                                            max={10}
                                            {...form.register(`items.${idx}.selfScore`, {
                                                setValueAs: (v) =>
                                                    v === "" || v === null ? undefined : Number(v),
                                            })}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Evaluation</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
