"use client";

import * as React from "react";
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
import EvaluationDetailsDialog from "@/components/users/EvaluationDetailsDialog";

// ✅ use shared client-side types
import type * as C from "@/types/evaluationDao.client";

export default function ViewEvaluationsDialog({
                                                  userId,
                                                  onClose,
                                              }: {
    userId: string;
    onClose: () => void;
}) {
    const [open, setOpen] = React.useState(true);
    const [year, setYear] = React.useState<string>("");
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<C.EvaluationClientDAO[]>([]);
    const [total, setTotal] = React.useState(0);

    // NEW: selected evaluation for details dialog
    const [selected, setSelected] = React.useState<C.EvaluationClientDAO | null>(null);
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                userId,
                page: String(page),
                pageSize: String(pageSize),
            });
            if (year.trim()) q.set("year", year.trim());
            const res = await fetch(`/api/users/evaluations?${q.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            const data: { data: C.EvaluationClientDAO[]; total: number } = await res.json();
            setRows(data.data || []);
            setTotal(data.total || 0);
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to load evaluations");
        } finally {
            setLoading(false);
        }
    }, [userId, page, pageSize, year]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const close = (v: boolean) => {
        setOpen(v);
        if (!v) onClose();
    };

    const pages = Math.max(1, Math.ceil(total / pageSize));
    const fmt = (d?: string | Date | null) => (d ? format(new Date(d), "yyyy-MM-dd") : "-");

    return (
        <>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Evaluations</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="w-32">
                            <label className="text-sm text-muted-foreground">Year</label>
                            <Input
                                placeholder="e.g. 2025"
                                value={year}
                                onChange={(e) => {
                                    setPage(1);
                                    setYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4));
                                }}
                            />
                        </div>
                        <div className="w-28">
                            <label className="text-sm text-muted-foreground">Page size</label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={pageSize}
                                onChange={(e) => {
                                    const next = Number(e.target.value || 10);
                                    setPage(1);
                                    setPageSize(Math.max(1, Math.min(100, next)));
                                }}
                            />
                        </div>
                        <Button variant="outline" onClick={() => { setPage(1); fetchData(); }}>
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    <div className="overflow-x-auto border rounded">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-muted/30">
                                <th className="p-2 border">Date</th>
                                <th className="p-2 border">Year</th>
                                <th className="p-2 border">Cycle</th>
                                <th className="p-2 border">Items</th>
                                <th className="p-2 border">Overall</th>
                                <th className="p-2 border">Evaluator</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((r) => (
                                <tr key={r._id}>
                                    <td className="p-2 border">
                                        {/* Date as link-styled button */}
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-blue-600 underline-offset-4"
                                            onClick={() => {
                                                setSelected(r);
                                                setDetailsOpen(true);
                                            }}
                                        >
                                            {fmt(r.evaluationDate)}
                                        </Button>
                                    </td>
                                    <td className="p-2 border">{r.year}</td>
                                    <td className="p-2 border">{r.cycleLabel || "-"}</td>
                                    <td className="p-2 border">{r.items?.length ?? 0}</td>
                                    <td className="p-2 border">
                                        {typeof r.overallScore === "number" ? r.overallScore.toFixed(2) : "-"}
                                    </td>
                                    <td className="p-2 border">
                                        {r.evaluatorName || r.evaluatorEmail || "-"}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-4 text-center" colSpan={6}>
                                        {loading ? "Loading..." : "No evaluations found."}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Total: {total} • Page {page} / {pages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                disabled={page >= pages}
                                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => close(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details dialog */}
            {selected && (
                <EvaluationDetailsDialog
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    evaluation={selected}
                    onSaved={(updated: C.EvaluationClientDAO) => {
                        // update local row inline
                        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
                        setDetailsOpen(false);
                        toast.success("Saved");
                    }}
                    onDeleted={() => {
                        // remove from local rows and refetch counts if needed
                        setRows((prev) => prev.filter((r) => r._id !== selected._id));
                        setTotal((t) => Math.max(0, t - 1));
                        setDetailsOpen(false);
                        toast.success("Deleted");
                    }}
                    onClose={() => {
                        setSelected(null);
                    }}
                />
            )}
        </>
    );
}
