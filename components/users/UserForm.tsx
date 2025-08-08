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

interface Props {
    onSuccess?: () => void;
}

export default function UserForm({ onSuccess }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            status: "Active",
            rolePosition: "Crew Member",
            graduationDate: undefined,
            dateHired: undefined,
        },
    });

    const onSubmit = async (data: UserFormData) => {
        setLoading(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Send Date objects; they serialize to ISO strings
                body: JSON.stringify({
                    ...data,
                    mavId: Number(data.mavId),
                    graduationDate: data.graduationDate ?? undefined,
                    dateHired: data.dateHired ?? undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to create user");
            }

            toast.success("User created successfully");
            form.reset({
                status: "Active",
                rolePosition: "Crew Member",
                graduationDate: undefined,
                dateHired: undefined,
            });
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.message || "Error creating user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
                <Input placeholder="First Name" {...form.register("firstName")} />
                <Input placeholder="Last Name" {...form.register("lastName")} />
            </div>

            <Input placeholder="Mav ID" {...form.register("mavId")} />
            <Input placeholder="Student Email" {...form.register("studentEmail")} />
            <Input placeholder="Work Email" {...form.register("workEmail")} />
            <Input placeholder="Phone Number" {...form.register("phoneNumber")} />

            {/* Graduation Date (shadcn date picker) */}
            <Controller
                control={form.control}
                name="graduationDate"
                render={({ field }) => (
                    <ShadcnDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Graduation Date"
                    />
                )}
            />

            {/* Hire Date (shadcn date picker) */}
            <Controller
                control={form.control}
                name="dateHired"
                render={({ field }) => (
                    <ShadcnDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Hire Date"
                    />
                )}
            />

            <Select
                onValueChange={(val) =>
                    form.setValue("rolePosition", val as UserFormData["rolePosition"])
                }
                defaultValue="Crew Member"
            >
                <SelectTrigger>
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

            <Select
                onValueChange={(val) =>
                    form.setValue("status", val as UserFormData["status"])
                }
                defaultValue="Active"
            >
                <SelectTrigger>
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>

            <Select
                onValueChange={(val) =>
                    form.setValue("shirtSize", val as UserFormData["shirtSize"])
                }
            >
                <SelectTrigger>
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
            />

            <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create User"}
            </Button>
        </form>
    );
}
