import { IUser } from "@/models/User";

let cachedUsers: IUser[] = [];

export const getCachedUsers = () => cachedUsers;

export const setCachedUsers = (users: IUser[]) => {
    cachedUsers = users;
};

export const addUserToCache = (user: IUser) => {
    cachedUsers = [user, ...cachedUsers];
};

export const updateUserInCache = (updatedUser: IUser) => {
    cachedUsers = cachedUsers.map((u) =>
        u.mavId === updatedUser.mavId ? updatedUser : u
    );
};

export const deleteUserFromCache = (mavId: number) => {
    cachedUsers = cachedUsers.filter((u) => u.mavId !== mavId);
};
