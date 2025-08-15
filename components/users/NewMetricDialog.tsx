// components/metrics/NewMetricDialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // or Input if you prefer
import { toast } from "sonner";

import { MetricType } from "@/models/Metric";
import {SelectEnumField} from "@/components/shared/SelectEnumField"; // your component

type FormValues = {
    metricType: MetricType;
    comment: string;
};

interface NewMetricDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    onCreated?: () => void; // optional: refresh parent
}

export default function NewMetricDialog({
                                            open,
                                            onOpenChange,
                                            userId,
                                            onCreated,
                                        }: NewMetricDialogProps) {
    const [loading, setLoading] = useState(false);

    const { control, register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            metricType: MetricType.Merit, // default to Merit
            comment: "",
        },
    });

    const onSubmit = async (data: FormValues) => {
        if (!data.comment.trim()) {
            toast.error("Comment is required");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/metrics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    metricType: data.metricType,
                    comment: data.comment,
                }),
            });
            if (!res.ok) throw new Error(await res.text());

            toast.success(
                data.metricType === MetricType.Merit ? "Merit added" : "Demerit added"
            );
            reset(); // clear form
            onOpenChange(false);
            onCreated?.();
        } catch (e) {
            toast.error("Failed to save metric");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => {
            if (!o) reset();
            onOpenChange(o);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Metric</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {/* Metric Type selector via your SelectEnumField */}
                    <SelectEnumField
                        control={control}
                        name="metricType"
                        options={MetricType}
                    />

                    {/* Comment */}
                    <div className="grid gap-2">
                        <label htmlFor="comment" className="text-sm font-medium">
                            Comment
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="Add context for this metric"
                            rows={4}
                            {...register("comment")}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
