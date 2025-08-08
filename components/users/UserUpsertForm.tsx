"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserFormData } from "@/lib/validations/userSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShadcnDatePicker } from "@/components/shared/ShadcnDatePicker";

type Mode = "create" | "edit";

export type ApiUser = {
    _id: string;
    firstName: string;
    lastName: string;
    rolePosition: "Department Head" | "Technician" | "Operations" | "Crew Member" | "Crew Lead";
    graduationDate?: string | Date | null;
    dateHired?: string | Date | null;
    mavId: number;
    status: "Active" | "Inactive";
    phoneNumber?: string;
    studentEmail?: string;
    workEmail?: string;
    dietaryRestrictions?: string;
    shirtSize?: "S" | "M" | "L" | "XL" | "2XL";
    keyRequest?: boolean;
};

function toDateOrUndefined(v: unknown): Date | undefined {
    if (!v) return undefined;
    try {
        const d = new Date(v as any);
        return isNaN(d.getTime()) ? undefined : d;
    } catch {
        return undefined;
    }
}

interface Props {
    mode: Mode;
    initial?: Partial<ApiUser>;
    onSuccess?: () => void;
    submitLabel?: string;
    /** when true, all inputs are disabled (read-only view) */
    disabled?: boolean;
    /** when true, hide the submit (Save) button entirely */
    hideSubmit?: boolean;
}

export default function UserUpsertForm({
                                           mode,
                                           initial,
                                           onSuccess,
                                           submitLabel,
                                           disabled = false,
                                           hideSubmit = false,
                                       }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: initial?.firstName ?? "",
            lastName: initial?.lastName ?? "",
            rolePosition: (initial?.rolePosition as UserFormData["rolePosition"]) ?? "Crew Member",
            graduationDate: toDateOrUndefined(initial?.graduationDate),
            dateHired: toDateOrUndefined(initial?.dateHired),
            mavId: initial?.mavId ? String(initial.mavId) : "",
            status: (initial?.status as UserFormData["status"]) ?? "Active",
            phoneNumber: initial?.phoneNumber ?? "",
            studentEmail: initial?.studentEmail ?? "",
            workEmail: initial?.workEmail ?? "",
            dietaryRestrictions: initial?.dietaryRestrictions ?? "",
            shirtSize: initial?.shirtSize as UserFormData["shirtSize"] | undefined,
            keyRequest: initial?.keyRequest ?? false,
        },
    });

    const onSubmit = async (data: UserFormData) => {
        setLoading(true);
        try {
            const body = {
                ...data,
                mavId: Number(data.mavId),
                graduationDate: data.graduationDate ?? undefined,
                dateHired: data.dateHired ?? undefined,
            };

            const res =
                mode === "create"
                    ? await fetch("/api/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    })
                    : await fetch(`/api/users/${initial?.mavId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Failed to ${mode} user`);
            }

            toast.success(mode === "create" ? "User created" : "User updated");
            onSuccess?.();

            if (mode === "create") {
                form.reset({
                    firstName: "",
                    lastName: "",
                    rolePosition: "Crew Member",
                    graduationDate: undefined,
                    dateHired: undefined,
                    mavId: "",
                    status: "Active",
                    phoneNumber: "",
                    studentEmail: "",
                    workEmail: "",
                    dietaryRestrictions: "",
                    shirtSize: undefined,
                    keyRequest: false,
                });
            }
        } catch (e: any) {
            toast.error(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Helpers to pass disabled state to selects
    const selectDisabled = (e?: string) => disabled ? undefined : e;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
                <Input placeholder="First Name" {...form.register("firstName")} disabled={disabled} />
                <Input placeholder="Last Name" {...form.register("lastName")} disabled={disabled} />
            </div>

            {/* Mav ID: always locked in edit mode; also lock if disabled */}
            <Input
                placeholder="Mav ID"
                {...form.register("mavId")}
                disabled={disabled || mode === "edit"}
            />

            <Input placeholder="Student Email" {...form.register("studentEmail")} disabled={disabled} />
            <Input placeholder="Work Email" {...form.register("workEmail")} disabled={disabled} />
            <Input placeholder="Phone Number" {...form.register("phoneNumber")} disabled={disabled} />

            <Controller
                control={form.control}
                name="graduationDate"
                render={({ field }) => (
                    <ShadcnDatePicker
                        value={field.value}
                        onChange={disabled ? () => {} : field.onChange}
                        placeholder="Graduation Date"
                        disabled={disabled}
                    />
                )}
            />

            <Controller
                control={form.control}
                name="dateHired"
                render={({ field }) => (
                    <ShadcnDatePicker
                        value={field.value}
                        onChange={disabled ? () => {} : field.onChange}
                        placeholder="Hire Date"
                        disabled={disabled}
                    />
                )}
            />

            {/* Role */}
            <Select
                onValueChange={(val) => selectDisabled(val) && form.setValue("rolePosition", val as UserFormData["rolePosition"])}
                defaultValue={form.getValues("rolePosition")}
            >
                <SelectTrigger disabled={disabled}>
                    <SelectValue placeholder="Role Position" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Department Head">Department Head</SelectItem>
                    <SelectItem value="Technician">Technician</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Crew Member">Crew Member</SelectItem>
                    <SelectItem value="Crew Lead">Crew Lead</SelectItem>
                </SelectContent>
            </Select>

            {/* Status */}
            <Select
                onValueChange={(val) => selectDisabled(val) && form.setValue("status", val as UserFormData["status"])}
                defaultValue={form.getValues("status")}
            >
                <SelectTrigger disabled={disabled}>
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>

            {/* Shirt Size */}
            <Select
                onValueChange={(val) =>
                    selectDisabled(val) && form.setValue("shirtSize", val as UserFormData["shirtSize"])
                }
                defaultValue={form.getValues("shirtSize")}
            >
                <SelectTrigger disabled={disabled}>
                    <SelectValue placeholder="Shirt Size" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="2XL">2XL</SelectItem>
                </SelectContent>
            </Select>

            <Input
                placeholder="Dietary Restrictions"
                {...form.register("dietaryRestrictions")}
                disabled={disabled}
            />

            {!hideSubmit && (
                <Button type="submit" disabled={loading || disabled}>
                    {loading ? (mode === "create" ? "Creating..." : "Saving...") : (submitLabel ?? (mode === "create" ? "Create User" : "Save Changes"))}
                </Button>
            )}
        </form>
    );
}