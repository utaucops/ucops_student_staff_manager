// components/form/SelectEnumField.tsx
"use client";

import * as React from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {NONE, type EnumType} from "@/types/generic";
import {enumValues, asEnum} from "@/lib/utils";

export type SelectEnumFieldProps<
    TFieldValues extends FieldValues,
    TEnum extends string
> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>; // the field type should be TEnum | null | undefined
    options: EnumType<TEnum>; // string enum or array of strings
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;       // show a "None" option that sets the field to null
    className?: string;
    itemLabel?: (value: TEnum) => React.ReactNode; // custom render for labels
};

export function SelectEnumField<
    TFieldValues extends FieldValues,
    TEnum extends string
>({
      control,
      name,
      options,
      label,
      placeholder,
      disabled,
      clearable,
      className,
      itemLabel,
  }: SelectEnumFieldProps<TFieldValues, TEnum>) {
    const allowed = enumValues(options);

    return (
        <div className={className}>
            {label ? <Label className="mb-1 block">{label}</Label> : null}

            <Controller
                control={control}
                name={name}
                render={({ field: { value, onChange } }) => (
                    <Select
                        value={(value as TEnum | null | undefined) ?? undefined}
                        onValueChange={(val) => {
                            if (disabled) return;
                            if (clearable && val === NONE) {
                                onChange(null);
                                return;
                            }
                            onChange(asEnum<TEnum>(val, allowed));
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder ?? "Select"} />
                        </SelectTrigger>
                        <SelectContent>
                            {clearable && <SelectItem value={NONE}>None</SelectItem>}
                            {allowed.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {itemLabel ? itemLabel(opt) : opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
        </div>
    );
}
