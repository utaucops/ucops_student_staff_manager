"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ApiUser } from "@/components/users/UserUpsertForm";
import CreateUserDialog from "@/components/users/CreateUserDialog";
import ViewUserDialog from "@/components/users/ViewUserDialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [search, setSearch] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setUsers(data);
        } catch {
            toast.error("Failed to load users");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fmt = (d?: string | Date | null) =>
        d ? format(new Date(d), "yyyy-MM-dd") : "-";

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">User Management</h1>

            <div className="flex gap-2">
                <Input
                    placeholder="Search by name, email, or Mav ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <CreateUserDialog onCreated={fetchUsers} />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                    <thead>
                    <tr>
                        <th className="border p-2">First</th>
                        <th className="border p-2">Last</th>
                        <th className="border p-2">Mav ID</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Role</th>
                        <th className="border p-2">Hire Date</th>
                        <th className="border p-2">Graduation</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) => (
                        <tr key={u._id}>
                            <td className="border p-2">{u.firstName}</td>
                            <td className="border p-2">{u.lastName}</td>
                            <td className="border p-2">{u.mavId}</td>
                            <td className="border p-2">{u.status}</td>
                            <td className="border p-2">{u.rolePosition}</td>
                            <td className="border p-2">{fmt(u.dateHired)}</td>
                            <td className="border p-2">{fmt(u.graduationDate)}</td>
                            <td className="border p-2">{u.studentEmail || "-"}</td>
                            <td className="border p-2">
                                <ViewUserDialog
                                    user={u}
                                    onChanged={fetchUsers}
                                    trigger={<Button variant="secondary">View</Button>}
                                />
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td className="p-4 text-center" colSpan={9}>
                                No users found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
