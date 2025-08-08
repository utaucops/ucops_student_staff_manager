"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserUpsertForm, { ApiUser } from "./UserUpsertForm";
import { toast } from "sonner";

export default function ViewUserDialog({
                                           user,
                                           onChanged,
                                           trigger,
                                       }: {
    user: ApiUser;
    /** call after save or delete to refresh table */
    onChanged: () => void;
    /** the button that opens the dialog (e.g., <Button>View</Button>) */
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [readOnly, setReadOnly] = useState(true);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        try {
            setDeleting(true);
            const res = await fetch(`/api/users/${user.mavId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted");
            onChanged();
            setOpen(false); // close modal
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setReadOnly(true); }}>
            {/* Trigger passed in by parent */}
            <div onClick={() => setOpen(true)}>{trigger}</div>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                </DialogHeader>

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

                <DialogFooter className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        {/* Close button */}
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>

                        {/* Edit toggles read-only -> editable */}
                        {readOnly ? (
                            <Button type="button" onClick={() => setReadOnly(false)}>
                                Edit
                            </Button>
                        ) : null}
                    </div>

                    {/* Delete on the right, always visible */}
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
    );
}
