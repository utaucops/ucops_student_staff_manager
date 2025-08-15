import { z } from "zod";
import { RolePosition } from "@/models/User";

/** Helpers */
const dateOrUndef = z.preprocess((v) => {
    if (v === "" || v == null) return undefined;
    // Allow string or Date input; coerce to Date or fail if invalid
    const d = v instanceof Date ? v : new Date(String(v));
    return isNaN(d.getTime()) ? undefined : d;
}, z.date().optional());

/**
 * Accept number or string (e.g. "15.25"), reject empty string/null/NaN,
 * and output a proper number >= 0.
 */
const hourlyPayNumber = z.preprocess((v) => {
    if (v === "" || v == null) return undefined;         // treat empty as missing
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
}, z.number({ error: "Hourly pay rate is required" })
    .nonnegative("Hourly pay rate cannot be negative"));

/** Main schema */
export const userSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    rolePosition: z.nativeEnum(RolePosition),
    graduationDate: dateOrUndef,          // Date | undefined
    dateHired: dateOrUndef,               // Date | undefined
    mavId: z.string().trim().min(1, "Mav ID is required"),
    status: z.enum(["Active", "Inactive"]),
    phoneNumber: z.string().trim().optional(),
    studentEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")).transform(v => v || undefined),
    workEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")).transform(v => v || undefined),
    dietaryRestrictions: z.string().trim().optional(),
    shirtSize: z.enum(["S","M","L","XL","2XL"]).optional(),
    keyRequest: z.boolean().optional().default(false),

    // NEW
    hourlyPayRate: hourlyPayNumber,       // <- outputs number
    mostRecentRaiseGranted: dateOrUndef,  // Date | undefined
});

export type UserFormData = z.infer<typeof userSchema>;
