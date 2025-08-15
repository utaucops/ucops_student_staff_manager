// types/userDao.server.ts
import { RolePosition, UserStatus, ShirtSize } from "@/models/User";

export interface UserServerDAO {
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

    dateHired?: Date | null;
    graduationDate?: Date | null;
    birthday?: Date | null;
    mostRecentRaiseGranted?: Date | null;

    hourlyPayRate?: number | null;

    dietaryRestrictions?: string | null;
    favorite_plant?: string | null;
    address?: string | null;

    updated_at?: Date | null;
    updated_by?: string | null;

    has_a_second_job?: boolean | null;
    has_ssn?: boolean | null;
    major?: string | null;

    nextRaiseEligibility?: Date | null;
    keyRequest?: boolean | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}
