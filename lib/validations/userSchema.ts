import { z } from "zod";

export const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    rolePosition: z.enum([
        "Department Head",
        "Technician",
        "Operations",
        "Crew Member",
        "Crew Lead",
    ]),
    // Treat as Date everywhere
    graduationDate: z.date().optional(),
    dateHired: z.date().optional(),
    mavId: z
        .string()
        .min(1, "Mav ID is required")
        .regex(/^\d+$/, "Mav ID must be numeric"),
    status: z.enum(["Active", "Inactive"]),
    phoneNumber: z.string().optional(),
    studentEmail: z.string().email("Invalid student email").optional(),
    workEmail: z.string().email("Invalid work email").optional(),
    dietaryRestrictions: z.string().optional(),
    shirtSize: z.enum(["S", "M", "L", "XL", "2XL"]).optional(),
    keyRequest: z.boolean().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
