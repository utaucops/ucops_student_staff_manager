"use client";

import {useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import UserUpsertForm from "./UserUpsertForm";
import type {UserClientDAO} from "@/types/userDao.client";
import {toast} from "sonner";
import NewEvaluationDialog from "@/components/users/NewEvaluationDialog";
import ViewEvaluationsDialog from "@/components/users/ViewEvaluationsDialog";
import {format} from "date-fns";
import NewMetricDialog from "@/components/users/NewMetricDialog";

export default function ViewUserDialog({
                                           user,
                                           onChanged,
                                           trigger,
                                       }: {
    user: UserClientDAO;
    onChanged: () => void;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [readOnly, setReadOnly] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const [openViewEvals, setOpenViewEvals] = useState(false);
    const [openMetricDialog, setOpenMetricDialog] = useState(false);


    const fmtDate = (d?: string | Date | null) =>
        d ? format(new Date(d), "yyyy-MM-dd") : "-";
    const fmtMoney = (n?: number | null) =>
        typeof n === "number" ? `$${n.toFixed(2)}` : "-";

    async function handleDelete() {
        try {
            setDeleting(true);
            // keeping your delete endpoint by Mav ID
            const res = await fetch(`/api/users/${user.mavId}`, {method: "DELETE"});
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted");
            onChanged();
            setOpen(false);
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) setReadOnly(true);
                }}
            >
                <div onClick={() => setOpen(true)}>{trigger}</div>

                <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <span>User Details</span>
                            <span className="text-sm font-normal text-muted-foreground">
                {user.firstName} {user.lastName} • {user.mavId}
              </span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Summary strip */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                        <InfoTile label="Role" value={user.rolePosition ? user.rolePosition : ""}/>
                        <InfoTile label="Status" value={user.status ? user.status : ""}/>
                        <InfoTile label="Hourly Pay" value={fmtMoney(user.hourlyPayRate)}/>
                        <InfoTile
                            label="Last Raise"
                            value={fmtDate(user.mostRecentRaiseGranted)}
                        />
                        <InfoTile
                            label="Next Raise"
                            value={fmtDate(user.nextRaiseEligibility)}
                        />
                        <InfoTile label="Hire Date" value={fmtDate(user.dateHired)}/>
                        <InfoTile label="Graduation" value={fmtDate(user.graduationDate)}/>
                        <InfoTile label="Student Email" value={user.studentEmail || "-"}/>
                        <InfoTile label="Work Email" value={user.workEmail || "-"}/>
                        <InfoTile label="Phone" value={user.phoneNumber || "-"}/>
                        <InfoTile label="Shirt Size" value={user.shirtSize || "-"}/>
                        <InfoTile
                            label="Key Request"
                            value={user.keyRequest ? "Yes" : "No"}
                        />
                    </div>

                    {/* Edit form */}
                    <UserUpsertForm
                        mode="edit"
                        initial={user}
                        onSuccess={() => {
                            onChanged();
                            setReadOnly(true);
                        }}
                        submitLabel="Save Changes"
                        disabled={readOnly}
                        hideSubmit={readOnly}
                    />

                    <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>

                            {readOnly ? (
                                <Button type="button" onClick={() => setReadOnly(false)}>
                                    Edit
                                </Button>
                            ) : null}

                            {/* New Evaluation opens via its own trigger */}
                            <NewEvaluationDialog
                                userId={user._id}
                                onCreated={() => {
                                    toast.success("Evaluation Created");
                                }}
                                trigger={<Button type="button">New Evaluation</Button>}
                            />

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setOpenViewEvals(true)}
                            >
                                View Evaluations
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setOpenMetricDialog(true)}
                            >
                                New Metric
                            </Button>
                        </div>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Evaluations Modal */}
            {openViewEvals && (
                <ViewEvaluationsDialog
                    userId={user._id}
                    onClose={() => setOpenViewEvals(false)}
                />
            )}

            {/* New Metric Modal */}
            {openMetricDialog && (
                <NewMetricDialog
                    open={openMetricDialog}
                    onOpenChange={setOpenMetricDialog}
                    userId={user._id}
                />
                )}
        </>
    );
}

/** Small display tile */
function InfoTile({label, value}: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium break-all">{value}</div>
        </div>
    );
}
