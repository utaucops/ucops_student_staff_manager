"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Type for single-date selection from react-day-picker v8
import type { SelectSingleEventHandler } from "react-day-picker";

// Valid caption layouts for Day Picker v8
type CaptionLayout = "label" | "dropdown" | "dropdown-months" | "dropdown-years";

type Props = {
    /** The selected date (or undefined). */
    value?: Date;
    /** Called when the user picks a date. */
    onChange: (date: Date | undefined) => void;
    /** Placeholder text when no date is selected. */
    placeholder?: string;
    /** Disable the trigger and calendar. */
    disabled?: boolean;
    /** Extra classes for the trigger button. */
    className?: string;

    /** Month/year UI config */
    captionLayout?: CaptionLayout; // default: "dropdown"
    /** Quick year bounds (used when fromMonth/toMonth not provided). */
    fromYear?: number;             // default: 1990
    toYear?: number;               // default: current year + 10
    /** Exact month bounds (overrides fromYear/toYear when provided). */
    fromMonth?: Date;
    toMonth?: Date;
};

export function ShadcnDatePicker({
                                     value,
                                     onChange,
                                     placeholder = "Pick a date",
                                     disabled,
                                     className,
                                     captionLayout = "dropdown",
                                     fromYear = 1990,
                                     toYear = new Date().getFullYear() + 10,
                                     fromMonth,
                                     toMonth,
                                 }: Props) {
    // Ensure types line up with single-mode selection
    const handleSelect: SelectSingleEventHandler = (date) => {
        onChange(date ?? undefined);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "yyyy-MM-dd") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    // ✅ Force single mode so types expect Date | undefined
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    initialFocus
                    // ✅ Month/Year controls
                    captionLayout={captionLayout}
                    // Use month bounds if provided, otherwise year bounds
                    {...(!fromMonth && !toMonth
                        ? { fromYear, toYear }
                        : { fromMonth, toMonth })}
                    // You can also pass 'disabled' days here if needed
                />
            </PopoverContent>
        </Popover>
    );
}
