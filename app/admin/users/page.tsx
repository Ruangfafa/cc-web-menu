import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
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
    const t = createTranslator(await getLocale());
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
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin">
                        {t("backToAdmin")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>{t("userManagement")}</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    {t("usersAdminDesc")}
                </p>
            </header>

            {users.length === 0 ? (
                <p style={{ color: "#666" }}>{t("noUsers")}</p>
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
                                        {t("email")}: {user.email}
                                    </p>

                                    <p style={{ margin: "0 0 6px" }}>
                                        {t("phone")}: {user.phone}
                                    </p>

                                    <p style={{ margin: "0 0 6px" }}>
                                        {t("addresses")} {user.addresses.length}
                                    </p>

                                    <p style={{ margin: 0 }}>
                                        {t("orders")} {user._count.orders}
                                    </p>
                                </div>

                                <form action={updateUserManagement}>
                                    <input type="hidden" name="userId" value={user.id} />

                                    <div style={{ marginBottom: 12 }}>
                                        <label htmlFor={`role-${user.id}`}>
                                            {t("role")}
                                        </label>

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
                                                    {role === UserRole.ADMIN
                                                        ? t("roleAdmin")
                                                        : t("roleCustomer")}
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
                                            {t("active")}
                                        </label>
                                    </div>

                                    <button type="submit">{t("updateUser")}</button>
                                </form>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
