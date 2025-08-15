"use client";

import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {VisuallyHidden} from "@radix-ui/react-visually-hidden";
import {Button} from "@/components/ui/button";
import UserUpsertForm from "./UserUpsertForm";
import {useState} from "react";

export default function CreateUserDialog({onCreated}: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <VisuallyHidden>
                    <DialogTitle>Create User</DialogTitle>
                </VisuallyHidden>
                <UserUpsertForm
                    mode="create"
                    onSuccess={() => {
                        onCreated();
                        setOpen(false);
                    }}
                    submitLabel="Create User"
                />
            </DialogContent>
        </Dialog>
    );
}
