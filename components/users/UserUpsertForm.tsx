// components/users/UserUpsertForm.tsx
"use client";

import {useState} from "react";
import {useForm, Controller, type DefaultValues} from "react-hook-form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {ShadcnDatePicker} from "@/components/shared/ShadcnDatePicker";
import {toast} from "sonner";

import type {UserClientDAO} from "@/types/userDao.client";
import User, {RolePosition, UserStatus, ShirtSize} from "@/models/User";
import {SelectEnumField} from "@/components/shared/SelectEnumField";

type Mode = "create" | "edit";

function toDateOrUndefined(v?: string | null): Date | undefined {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function emptyToNull(v: unknown): string | null {
    if (typeof v !== "string") return v as any;
    return v.trim() === "" ? null : v;
}

interface Props {
    mode: Mode;
    initial?: Partial<UserClientDAO>;
    onSuccess?: () => void;
    submitLabel?: string;
    disabled?: boolean;
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

    // Use the DAO directly for form typing
    const defaults: DefaultValues<Partial<UserClientDAO>> = {
        _id: initial?._id,
        firstName: initial?.firstName ?? "",
        lastName: initial?.lastName ?? "",
        rolePosition: (initial?.rolePosition as RolePosition) ?? RolePosition.SetupCrew,

        mavId: initial?.mavId ?? null,
        w2w_employee_id: initial?.w2w_employee_id ?? "",
        teams_id: initial?.teams_id ?? "",

        status: (initial?.status as UserStatus) ?? UserStatus.Active,
        phoneNumber: initial?.phoneNumber ?? "",
        studentEmail: initial?.studentEmail ?? "",
        workEmail: initial?.workEmail ?? "",

        shirtSize: (initial?.shirtSize as ShirtSize) ?? undefined,

        dateHired: initial?.dateHired ?? null,
        graduationDate: initial?.graduationDate ?? null,
        birthday: initial?.birthday ?? null,

        hourlyPayRate: typeof initial?.hourlyPayRate === "number" ? initial.hourlyPayRate : null,
        mostRecentRaiseGranted: initial?.mostRecentRaiseGranted ?? null,

        dietaryRestrictions: initial?.dietaryRestrictions ?? "",
        favorite_plant: initial?.favorite_plant ?? "",
        address: initial?.address ?? "",

        keyRequest: initial?.keyRequest ?? false,
        has_a_second_job: initial?.has_a_second_job ?? false,
        has_ssn: initial?.has_ssn ?? false,
        major: initial?.major ?? "",
    };

    const form = useForm<Partial<UserClientDAO>>({defaultValues: defaults});

    const onSubmit = async (data: Partial<UserClientDAO>) => {
        setLoading(true);
        try {
            const body: Partial<UserClientDAO> = {
                // strings → null if empty, keep undefined if untouched
                firstName: emptyToNull(data.firstName) as any,
                lastName: emptyToNull(data.lastName) as any,
                rolePosition: (data.rolePosition as RolePosition) ?? null,

                // numeric
                mavId:
                    typeof data.mavId === "number"
                        ? data.mavId
                        : data.mavId == null
                            ? null
                            : Number(data.mavId),

                w2w_employee_id: emptyToNull(data.w2w_employee_id),
                teams_id: emptyToNull(data.teams_id),

                status: (data.status as UserStatus) ?? null,
                phoneNumber: emptyToNull(data.phoneNumber),
                studentEmail: emptyToNull(data.studentEmail),
                workEmail: emptyToNull(data.workEmail),

                shirtSize: (data.shirtSize as ShirtSize) ?? null,

                // DatePickers convert here: Date -> ISO (form keeps ISO/null)
                dateHired: data.dateHired ?? null,
                graduationDate: data.graduationDate ?? null,
                birthday: data.birthday ?? null,
                mostRecentRaiseGranted: data.mostRecentRaiseGranted ?? null,

                hourlyPayRate:
                    typeof data.hourlyPayRate === "number"
                        ? data.hourlyPayRate
                        : data.hourlyPayRate == null
                            ? null
                            : Number(data.hourlyPayRate),

                dietaryRestrictions: emptyToNull(data.dietaryRestrictions),
                favorite_plant: emptyToNull(data.favorite_plant),
                address: emptyToNull(data.address),

                keyRequest:
                    typeof data.keyRequest === "boolean" ? data.keyRequest : null,
                has_a_second_job:
                    typeof data.has_a_second_job === "boolean" ? data.has_a_second_job : null,
                has_ssn:
                    typeof data.has_ssn === "boolean" ? data.has_ssn : null,
                major: emptyToNull(data.major) as any,
            };

            const res =
                mode === "create"
                    ? await fetch("/api/users", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify(body),
                    })
                    : await fetch(`/api/users/${initial?._id}`, {
                        method: "PUT",
                        headers: {"Content-Type": "application/json"},
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
                    rolePosition: RolePosition.SetupCrew,

                    mavId: null,
                    w2w_employee_id: "",
                    teams_id: "",

                    status: UserStatus.Active,
                    phoneNumber: "",
                    studentEmail: "",
                    workEmail: "",

                    shirtSize: undefined,

                    dateHired: null,
                    graduationDate: null,
                    birthday: null,
                    mostRecentRaiseGranted: null,

                    hourlyPayRate: null,

                    dietaryRestrictions: "",
                    favorite_plant: "",
                    address: "",

                    keyRequest: false,
                    has_a_second_job: false,
                    has_ssn: false,
                    major: "",
                });
            }
        } catch (e: any) {
            toast.error(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">
            {/* Name */}
            <div className="flex gap-2">
                <Input placeholder="First Name" {...form.register("firstName")} disabled={disabled}/>
                <Input placeholder="Last Name" {...form.register("lastName")} disabled={disabled}/>
            </div>

            {/* IDs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                    placeholder="Mav ID"
                    type="number"
                    {...form.register("mavId", {
                        setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                    })}
                    disabled={disabled || mode === "edit"}
                />
                <Input placeholder="W2W Employee ID" {...form.register("w2w_employee_id")} disabled={disabled}/>
                <Input placeholder="Teams ID" {...form.register("teams_id")} disabled={disabled}/>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Student Email" {...form.register("studentEmail")} disabled={disabled}/>
                <Input placeholder="Work Email" {...form.register("workEmail")} disabled={disabled}/>
                <Input placeholder="Phone Number" {...form.register("phoneNumber")} disabled={disabled}/>
            </div>

            {/* Role / Status / Shirt */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <SelectEnumField<Partial<UserClientDAO>, RolePosition>
                    control={form.control}
                    name="rolePosition"
                    options={RolePosition}
                    label="Role Position"
                    placeholder="Role Position"
                    clearable/>

                <SelectEnumField<Partial<UserClientDAO>, UserStatus>
                    control={form.control}
                    name="status"
                    options={UserStatus}
                    label="Status"
                    placeholder="Status"
                    clearable
                />

                <SelectEnumField<Partial<UserClientDAO>, ShirtSize>
                    control={form.control}
                    name="shirtSize"
                    options={ShirtSize}
                    label="Shirt Size"
                    placeholder="Shirt Size"
                    clearable
                />
            </div>

            {/* Dates (convert between DatePicker <-> ISO strings in the controller) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Controller
                    control={form.control}
                    name="dateHired"
                    render={({field}) => (
                        <ShadcnDatePicker
                            value={toDateOrUndefined(field.value)}
                            onChange={disabled ? () => {
                            } : (d) => field.onChange(d ? d.toISOString() : null)}
                            placeholder="Hire Date"
                            disabled={disabled}
                        />
                    )}
                />
                <Controller
                    control={form.control}
                    name="graduationDate"
                    render={({field}) => (
                        <ShadcnDatePicker
                            value={toDateOrUndefined(field.value)}
                            onChange={disabled ? () => {
                            } : (d) => field.onChange(d ? d.toISOString() : null)}
                            placeholder="Graduation Date"
                            disabled={disabled}
                        />
                    )}
                />
                <Controller
                    control={form.control}
                    name="birthday"
                    render={({field}) => (
                        <ShadcnDatePicker
                            value={toDateOrUndefined(field.value)}
                            onChange={disabled ? () => {
                            } : (d) => field.onChange(d ? d.toISOString() : null)}
                            placeholder="Birthday"
                            disabled={disabled}
                        />
                    )}
                />
            </div>

            {/* Pay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Hourly Pay Rate (USD)"
                    {...form.register("hourlyPayRate", {
                        setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                    })}
                    disabled={disabled}
                />
                <Controller
                    control={form.control}
                    name="mostRecentRaiseGranted"
                    render={({field}) => (
                        <ShadcnDatePicker
                            value={toDateOrUndefined(field.value)}
                            onChange={disabled ? () => {
                            } : (d) => field.onChange(d ? d.toISOString() : null)}
                            placeholder="Most Recent Raise Granted"
                            disabled={disabled}
                        />
                    )}
                />
            </div>

            {/* Misc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Dietary Restrictions" {...form.register("dietaryRestrictions")}
                       disabled={disabled}/>
                <Input placeholder="Favorite Plant" {...form.register("favorite_plant")} disabled={disabled}/>
                <Input placeholder="Major" {...form.register("major")} disabled={disabled}/>
            </div>

            <Input placeholder="Address" {...form.register("address")} disabled={disabled}/>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                    <Switch
                        id="keyRequest"
                        checked={!!form.watch("keyRequest")}
                        onCheckedChange={(v) => !disabled && form.setValue("keyRequest", v, {shouldDirty: true})}
                        disabled={disabled}
                    />
                    <Label htmlFor="keyRequest">Key Request</Label>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        id="has_a_second_job"
                        checked={!!form.watch("has_a_second_job")}
                        onCheckedChange={(v) => !disabled && form.setValue("has_a_second_job", v, {shouldDirty: true})}
                        disabled={disabled}
                    />
                    <Label htmlFor="has_a_second_job">Has a Second Job</Label>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        id="has_ssn"
                        checked={!!form.watch("has_ssn")}
                        onCheckedChange={(v) => !disabled && form.setValue("has_ssn", v, {shouldDirty: true})}
                        disabled={disabled}
                    />
                    <Label htmlFor="has_ssn">Has SSN</Label>
                </div>
            </div>

            {!hideSubmit && (
                <Button type="submit" disabled={loading || disabled}>
                    {loading
                        ? mode === "create"
                            ? "Creating..."
                            : "Saving..."
                        : submitLabel ?? (mode === "create" ? "Create User" : "Save Changes")}
                </Button>
            )}
        </form>
    );
}
