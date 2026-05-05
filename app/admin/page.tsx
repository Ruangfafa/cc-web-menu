import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher";

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
    const t = createTranslator(await getLocale());
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
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>
                        {t("helloUser", {
                            name: session.user.name || t("user"),
                        })}
                    </strong>
                </p>

                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <Link className="menu-action-button" href="/menu">
                        {t("backToMenu")}
                    </Link>
                </div>
            </section>

            <h1>{t("adminDashboard")}</h1>

            <p>
                {t("welcomeName", { name: session.user.name || t("user") })}
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
                    <h2>{t("generalItemManagement")}</h2>
                    <p>{t("generalItemManagementDesc")}</p>
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
                    <h2>{t("subItemManagement")}</h2>
                    <p>{t("subItemManagementDesc")}</p>
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
                    <h2>{t("optionGroupManagement")}</h2>
                    <p>{t("optionGroupManagementDesc")}</p>
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
                    <h2>{t("menuConfiguration")}</h2>
                    <p>{t("menuConfigurationDesc")}</p>
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
                    <h2>{t("orderManagement")}</h2>
                    <p>{t("orderManagementDesc")}</p>
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
                    <h2>{t("userManagement")}</h2>
                    <p>{t("userManagementDesc")}</p>
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
                    <h2>{t("settings")}</h2>
                    <p>{t("settingsDesc")}</p>
                </a>
            </section>
        </main>
    );
}
