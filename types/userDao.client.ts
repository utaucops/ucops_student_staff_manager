// types/userDao.client.ts
import { RolePosition, UserStatus, ShirtSize } from "@/models/User";

export interface UserClientDAO {
    _id: string;

    firstName?: string | null;
    lastName?: string | null;
    rolePosition?: RolePosition | null;

    mavId?: number | null;
    w2w_employee_id?: string | null;
    teams_id?: string | null;

    status?: UserStatus | null;
    phoneNumber?: string | null;
    studentEmail?: string | null;
    workEmail?: string | null;

    shirtSize?: ShirtSize | null;

    dateHired?: string | null;         // ISO
    graduationDate?: string | null;    // ISO
    birthday?: string | null;          // ISO
    mostRecentRaiseGranted?: string | null; // ISO

    hourlyPayRate?: number | null;

    dietaryRestrictions?: string | null;
    favorite_plant?: string | null;
    address?: string | null;

    updated_at?: string | null;        // ISO
    updated_by?: string | null;

    has_a_second_job?: boolean | null;
    has_ssn?: boolean | null;
    major?: string | null;

    nextRaiseEligibility?: string | null; // ISO (virtual)
    keyRequest?: boolean | null;
    createdAt?: string | null;            // ISO (from timestamps)
    updatedAt?: string | null;            // ISO (from timestamps)
}
