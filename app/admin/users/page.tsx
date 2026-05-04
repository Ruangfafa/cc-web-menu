import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateUserManagement } from "./actions";

/**
 * 管理员用户管理页
 *
 * 路径：
 * GET /admin/users
 *
 * 功能：
 * 1. 查看所有用户
 * 2. 查看地址数量和订单数量
 * 3. 修改用户角色和启用状态
 */
export default async function AdminUsersPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }

    const users = await prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
            addresses: true,
            _count: {
                select: {
                    orders: true,
                },
            },
        },
    });

    return (
        <main style={{ maxWidth: 1100, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/admin">Back to admin</Link>
                </p>

                <h1 style={{ margin: "0 0 8px" }}>User Management</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    View customer accounts and update access settings.
                </p>
            </header>

            {users.length === 0 ? (
                <p style={{ color: "#666" }}>No users found.</p>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {users.map((user) => (
                        <article
                            key={user.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 10,
                                padding: 16,
                                background: "#fff",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <p style={{ margin: "0 0 8px" }}>
                                        <strong>{user.name}</strong>
                                    </p>

                                    <p style={{ margin: "0 0 6px" }}>
                                        Email: {user.email}
                                    </p>

                                    <p style={{ margin: "0 0 6px" }}>
                                        Phone: {user.phone}
                                    </p>

                                    <p style={{ margin: "0 0 6px" }}>
                                        Addresses: {user.addresses.length}
                                    </p>

                                    <p style={{ margin: 0 }}>
                                        Orders: {user._count.orders}
                                    </p>
                                </div>

                                <form action={updateUserManagement}>
                                    <input type="hidden" name="userId" value={user.id} />

                                    <div style={{ marginBottom: 12 }}>
                                        <label htmlFor={`role-${user.id}`}>Role</label>

                                        <select
                                            id={`role-${user.id}`}
                                            name="role"
                                            defaultValue={user.role}
                                            style={{
                                                display: "block",
                                                marginTop: 4,
                                            }}
                                        >
                                            {Object.values(UserRole).map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: 12 }}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                defaultChecked={user.isActive}
                                            />{" "}
                                            Active
                                        </label>
                                    </div>

                                    <button type="submit">Update User</button>
                                </form>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
