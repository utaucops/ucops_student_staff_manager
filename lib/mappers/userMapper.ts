// lib/mappers/userMappers.ts
import type { IUser } from "@/models/User";
import { RolePosition, ShirtSize, UserStatus } from "@/models/User";
import type { UserServerDAO } from "@/types/userDao.server";
import type { UserClientDAO } from "@/types/userDao.client";

/** Safe date helpers */
function toDate(v: Date | string | number | null | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}
function toISO(v: Date | null | undefined): string | null {
    return v ? new Date(v).toISOString() : null;
}
function toEnum<T>(val: any, allowed: readonly string[]): T | null {
    return allowed.includes(val) ? (val as T) : null;
}

/** Mongoose doc -> Server DAO */
export function userDocToServerDAO(doc: IUser): UserServerDAO {
    const id = doc._id?.toString?.() ?? String(doc._id);

    return {
        _id: id,

        firstName: doc.firstName ?? null,
        lastName: doc.lastName ?? null,
        rolePosition: doc.rolePosition ?? null,

        mavId: doc.mavId ?? null,
        w2w_employee_id: doc.w2w_employee_id ?? null,
        teams_id: doc.teams_id ?? null,

        status: doc.status ?? null,
        phoneNumber: doc.phoneNumber ?? null,
        studentEmail: doc.studentEmail ?? null,
        workEmail: doc.workEmail ?? null,

        shirtSize: doc.shirtSize ?? null,

        dateHired: doc.dateHired ?? null,
        graduationDate: doc.graduationDate ?? null,
        birthday: doc.birthday ?? null,
        mostRecentRaiseGranted: doc.mostRecentRaiseGranted ?? null,

        hourlyPayRate: doc.hourlyPayRate ?? null,

        dietaryRestrictions: doc.dietaryRestrictions ?? null,
        favorite_plant: doc.favorite_plant ?? null,
        address: doc.address ?? null,

        updated_at: doc.updated_at ?? null,
        updated_by: doc.updated_by ?? null,

        has_a_second_job: doc.has_a_second_job ?? null,
        has_ssn: doc.has_ssn ?? null,
        major: doc.major ?? null,

        nextRaiseEligibility: (doc as any).nextRaiseEligibility ?? null,
        createdAt: doc.createdAt ?? null,
        updatedAt: (doc as any).updatedAt ?? null,
    };
}

/** Server DAO -> Client DAO */
export function userServerToClientDAO(s: UserServerDAO): UserClientDAO {
    return {
        _id: s._id,

        firstName: s.firstName ?? null,
        lastName: s.lastName ?? null,
        rolePosition: s.rolePosition ?? null,

        mavId: s.mavId ?? null,
        w2w_employee_id: s.w2w_employee_id ?? null,
        teams_id: s.teams_id ?? null,

        status: s.status ?? null,
        phoneNumber: s.phoneNumber ?? null,
        studentEmail: s.studentEmail ?? null,
        workEmail: s.workEmail ?? null,

        shirtSize: s.shirtSize ?? null,

        dateHired: toISO(s.dateHired),
        graduationDate: toISO(s.graduationDate),
        birthday: toISO(s.birthday),
        mostRecentRaiseGranted: toISO(s.mostRecentRaiseGranted),

        hourlyPayRate: s.hourlyPayRate ?? null,

        dietaryRestrictions: s.dietaryRestrictions ?? null,
        favorite_plant: s.favorite_plant ?? null,
        address: s.address ?? null,

        updated_at: toISO(s.updated_at),
        updated_by: s.updated_by ?? null,

        has_a_second_job: s.has_a_second_job ?? null,
        has_ssn: s.has_ssn ?? null,
        major: s.major ?? null,

        nextRaiseEligibility: toISO(s.nextRaiseEligibility),
        createdAt: toISO(s.createdAt),
        updatedAt: toISO(s.updatedAt),
    };
}

/** Client payload -> Partial model shape (for create/update) */
export type UserUpsertPayload =
    | Partial<Omit<UserClientDAO, "_id">>
    | Partial<Omit<UserServerDAO, "_id">>;

export function buildModelPayloadFromUpsert(p: UserUpsertPayload) {
    // Accept both client ISO strings and server Date types gracefully
    return {
        firstName: p.firstName ?? null,
        lastName: p.lastName ?? null,
        rolePosition: toEnum<RolePosition>(
            p.rolePosition,
            Object.values(RolePosition)
        ),

        mavId: p.mavId ?? null,
        w2w_employee_id: p.w2w_employee_id ?? null,
        teams_id: p.teams_id ?? null,

        status: toEnum<UserStatus>(p.status, Object.values(UserStatus)),
        phoneNumber: p.phoneNumber ?? null,
        studentEmail: p.studentEmail ?? null,
        workEmail: p.workEmail ?? null,

        shirtSize: toEnum<ShirtSize>(p.shirtSize, Object.values(ShirtSize)),

        dateHired: toDate(p.dateHired),
        graduationDate: toDate(p.graduationDate),
        birthday: toDate(p.birthday),
        mostRecentRaiseGranted: toDate(p.mostRecentRaiseGranted),

        hourlyPayRate: p.hourlyPayRate ?? null,

        dietaryRestrictions: p.dietaryRestrictions ?? null,
        favorite_plant: p.favorite_plant ?? null,
        address: p.address ?? null,

        updated_at: toDate(p.updated_at),
        updated_by: p.updated_by ?? null,

        has_a_second_job: p.has_a_second_job ?? null,
        has_ssn: p.has_ssn ?? null,
        major: p.major ?? null,
    };
}
