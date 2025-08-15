"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import CreateUserDialog from "@/components/users/CreateUserDialog";
import ViewUserDialog from "@/components/users/ViewUserDialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { UserClientDAO } from "@/types/userDao.client";
import EnumFilter from "@/components/shared/EnumFilter";
import { RolePosition, UserStatus } from "@/models/User";

type SortKey = "firstName" | "lastName" | "rolePosition" | "dateHired" | "graduationDate" | "hourlyPayRate";
type SortDirection = "asc" | "desc";

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserClientDAO[]>([]);
    const [search, setSearch] = useState("");
    const [positionFilter, setPositionFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>(["Active"]);
    const [sortKey, setSortKey] = useState<SortKey>("firstName");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const fetchUsers = async () => {
        console.log("Fetching users with", { search, positionFilter, statusFilter });
        try {
            let baseUrl = "/api/users";
            baseUrl = baseUrl.concat(`?search=${encodeURIComponent(search)}`);

            if (positionFilter.length > 0) {
                baseUrl = baseUrl.concat(`&positionFilter=${positionFilter.join(",")}`);
            }

            if (statusFilter.length > 0) {
                baseUrl = baseUrl.concat(`&statusFilter=${statusFilter.join(",")}`);
            }

            const res = await fetch(baseUrl);
            if (!res.ok) throw new Error("Bad response");
            const data = (await res.json()) as UserClientDAO[];
            setUsers(data);
        } catch {
            toast.error("Failed to load users");
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, positionFilter, statusFilter]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let valA : any = a[sortKey];
            let valB : any = b[sortKey];

            // Handle dates and numbers separately
            if (valA instanceof Date || valB instanceof Date || sortKey.includes("Date")) {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (typeof valA === "number" || typeof valB === "number") {
                valA = valA ?? 0;
                valB = valB ?? 0;
            } else {
                valA = (valA ?? "").toString().toLowerCase();
                valB = (valB ?? "").toString().toLowerCase();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [users, sortKey, sortDirection]);

    const fmtDate = (d?: string | Date | null) =>
        d ? format(new Date(d), "yyyy-MM-dd") : "-";

    const fmtMoney = (n?: number | null) =>
        typeof n === "number" ? `$${n.toFixed(2)}` : "-";

    const renderSortIndicator = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortDirection === "asc" ? " ▲" : " ▼";
    };

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">User Management</h1>

            <div className="flex gap-2">
                <Input
                    placeholder="Search by Name, Email, or Mav ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <CreateUserDialog onCreated={fetchUsers} />
            </div>

            <div className="flex gap-4">
                <EnumFilter options={RolePosition} name={"Position Filter"} setFilters={setPositionFilter} />
            </div>

            <div className="flex gap-4">
                <EnumFilter
                    name={"Status Filter"}
                    options={UserStatus}
                    setFilters={setStatusFilter}
                    selectedFilters={statusFilter}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                    <thead>
                    <tr className="bg-muted/40">
                        <th className="border p-2 cursor-pointer" onClick={() => toggleSort("firstName")}>
                            First {renderSortIndicator("firstName")}
                        </th>
                        <th className="border p-2 cursor-pointer" onClick={() => toggleSort("lastName")}>
                            Last {renderSortIndicator("lastName")}
                        </th>
                        <th className="border p-2 whitespace-nowrap">Mav ID</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2 cursor-pointer" onClick={() => toggleSort("rolePosition")}>
                            Role {renderSortIndicator("rolePosition")}
                        </th>
                        <th className="border p-2 whitespace-nowrap cursor-pointer" onClick={() => toggleSort("dateHired")}>
                            Hire Date {renderSortIndicator("dateHired")}
                        </th>
                        <th className="border p-2 whitespace-nowrap cursor-pointer" onClick={() => toggleSort("graduationDate")}>
                            Graduation {renderSortIndicator("graduationDate")}
                        </th>
                        <th className="border p-2 whitespace-nowrap cursor-pointer" onClick={() => toggleSort("hourlyPayRate")}>
                            Hourly Pay {renderSortIndicator("hourlyPayRate")}
                        </th>
                        <th className="border p-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-muted/20">
                            <td className="border p-2">{u.firstName}</td>
                            <td className="border p-2">{u.lastName}</td>
                            <td className="border p-2">{u.mavId}</td>
                            <td className="border p-2">{u.status}</td>
                            <td className="border p-2">{u.rolePosition}</td>
                            <td className="border p-2">{fmtDate(u.dateHired)}</td>
                            <td className="border p-2">{fmtDate(u.graduationDate)}</td>
                            <td className="border p-2">{fmtMoney(u.hourlyPayRate)}</td>
                            <td className="border max-w-full p-2">
                                <ViewUserDialog
                                    user={u}
                                    onChanged={fetchUsers}
                                    trigger={<Button variant="secondary">View</Button>}
                                />
                            </td>
                        </tr>
                    ))}
                    {sortedUsers.length === 0 && (
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
