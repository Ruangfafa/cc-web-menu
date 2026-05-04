import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * 管理员后台首页
 *
 * 路径：
 * GET /admin
 *
 * 功能：
 * 1. 检查用户是否登录
 * 2. 检查用户 role 是否是 ADMIN
 * 3. 未登录 → 跳转 /login
 * 4. 已登录但不是 ADMIN → 跳转 /
 * 5. 是 ADMIN → 显示后台入口
 */
export default async function AdminPage() {
    /**
     * auth() 可以在 Server Component 中读取当前登录 session。
     */
    const session = await auth();

    /**
     * 如果没有登录，跳到登录页面。
     */
    if (!session?.user) {
        redirect("/login");
    }

    /**
     * 如果登录了，但不是管理员，跳回首页。
     *
     * 注意：
     * role 是我们自己加到 session.user 里的字段，
     * NextAuth 默认类型里没有 role，
     * 所以这里先用 as any。
     */
    if ((session.user as any).role !== "ADMIN") {
        redirect("/");
    }

    /**
     * 到这里说明：
     * - 已登录
     * - role 是 ADMIN
     */
    return (
        <main style={{ maxWidth: 900, margin: "80px auto", padding: 24 }}>
            <h1>Admin Dashboard</h1>

            <p>
                Welcome, <strong>{session.user.name}</strong>
            </p>

            <section
                style={{
                    marginTop: 32,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                }}
            >
                <a
                    href="/admin/general-items"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>General Item Management</h2>
                    <p>Upload and manage base dishes in general_items.</p>
                </a>

                <a
                    href="/admin/sub-items"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>Sub Item Management</h2>
                    <p>Upload and manage add-ons such as rice, egg, spicy level, and drinks.</p>
                </a>

                <a
                    href="/admin/menu"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>Menu Configuration</h2>
                    <p>Build the customer-facing menu from general items and option groups.</p>
                </a>

                <a
                    href="/admin/option-groups"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>Option Group Management</h2>
                    <p>Create option groups such as spicy level, add-ons, and drinks.</p>
                </a>

                <a
                    href="/admin/orders"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>Order Management</h2>
                    <p>View and update customer orders.</p>
                </a>

                <a
                    href="/admin/users"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>User Management</h2>
                    <p>View customer accounts.</p>
                </a>

                <a
                    href="/admin/delivery"
                    style={{
                        display: "block",
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <h2>Settings</h2>
                    <p>Manage delivery mode, site addresses, and checkout requirements.</p>
                </a>
            </section>
        </main>
    );
}
