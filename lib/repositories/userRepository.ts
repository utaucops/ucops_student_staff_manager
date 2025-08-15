// lib/repositories/userRepository.ts
import type { FilterQuery, ProjectionType, QueryOptions } from "mongoose";
import UserModel, { IUser } from "@/models/User";
import type { UserServerDAO } from "@/types/userDao.server";
import type { UserClientDAO } from "@/types/userDao.client";
import {
    userDocToServerDAO,
    userServerToClientDAO,
    buildModelPayloadFromUpsert,
    type UserUpsertPayload,
} from "@/lib/mappers/userMapper";

export interface ListOptions {
    filter?: FilterQuery<IUser>;
    limit?: number;
    page?: number; // 1-based
    sort?: QueryOptions["sort"];
    projection?: ProjectionType<IUser>;
    lean?: boolean; // default false (we want virtual nextRaiseEligibility)
}

export async function getById(id: string): Promise<UserClientDAO | null> {
    const doc = await UserModel.findById(id).exec();
    if (!doc) return null;
    const server = userDocToServerDAO(doc);
    return userServerToClientDAO(server);
}

export async function listUsers(opts: ListOptions = {}): Promise<{
    data: UserClientDAO[];
    total: number;
    page: number;
    pages: number;
}> {
    const {
        filter = {},
        limit = 20,
        page = 1,
        sort = { createdAt: -1 },
        projection,
        lean = false,
    } = opts;

    const skip = (Math.max(1, page) - 1) * limit;

    const [docs, total] = await Promise.all([
        UserModel.find(filter, projection, { sort, skip, limit, lean }).exec(),
        UserModel.countDocuments(filter).exec(),
    ]);

    const data = (docs as any[]).map((d) => {
        // If lean, d is a plain object—re-wrap minimally to reuse mappers safely:
        const docLike = lean ? new UserModel(d) : (d as IUser);
        const server = userDocToServerDAO(docLike as IUser);
        return userServerToClientDAO(server);
    });

    const pages = Math.max(1, Math.ceil(total / limit));
    return { data, total, page, pages };
}

export async function createUser(payload: UserUpsertPayload): Promise<UserClientDAO> {
    const modelPayload = buildModelPayloadFromUpsert(payload);
    const doc = await UserModel.create(modelPayload);
    const server = userDocToServerDAO(doc);
    return userServerToClientDAO(server);
}

export async function updateUserById(
    id: string,
    payload: UserUpsertPayload
): Promise<UserClientDAO | null> {
    const modelPayload = buildModelPayloadFromUpsert(payload);

    const doc = await UserModel.findByIdAndUpdate(
        id,
        { $set: modelPayload },
        { new: true } // return updated doc
    ).exec();

    if (!doc) return null;
    const server = userDocToServerDAO(doc);
    return userServerToClientDAO(server);
}

export async function deleteUserById(id: string): Promise<boolean> {
    const res = await UserModel.deleteOne({ _id: id }).exec();
    return res.deletedCount === 1;
}

/** Convenience: upsert by mavId (common in campus systems) */
export async function upsertByMavId(
    mavId: number,
    payload: UserUpsertPayload
): Promise<UserClientDAO> {
    const modelPayload = buildModelPayloadFromUpsert(payload);
    const doc = await UserModel.findOneAndUpdate(
        { mavId },
        { $set: modelPayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    const server = userDocToServerDAO(doc as IUser);
    return userServerToClientDAO(server);
}
