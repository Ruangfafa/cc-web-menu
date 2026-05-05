import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { createSubItem, deleteSubItem } from "./actions";

/**
 * 附属项管理页面
 *
 * 路径：
 * /admin/sub-items
 *
 * 功能：
 * 1. 管理员新增附属项
 * 2. 显示 sub_items 表里的附属项
 *
 * 注意：
 * 这里不设置价格。
 * 价格以后在菜单配置里的 option_group_items 设置。
 */
export default async function AdminSubItemsPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    const subItems = await prisma.subItem.findMany({
        orderBy: {
            id: "asc",
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
            <header style={{ marginBottom: 32 }}>
                <h1>{t("subItemManagement")}</h1>
                <p>{t("subItemsAdminDesc")}</p>

            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("addSubItem")}</h2>

                <form action={createSubItem}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">{t("subItemName")}</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="例如：加饭、加蛋、微辣、可乐"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <button type="submit">{t("addSubItem")}</button>
                </form>
            </section>

            <section>
                <h2>{t("existingSubItems")}</h2>

                {subItems.length === 0 ? (
                    <p>{t("noSubItems")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {subItems.map((item) => (
                            <article
                                key={item.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 16,
                                }}
                            >
                                <h3>{item.name}</h3>
                                <p>
                                    <strong>{t("idLabel")}</strong>
                                    {item.id}
                                </p>
                                <div className="admin-item-actions">
                                    <a
                                        className="menu-action-button"
                                        href={`/admin/sub-items/${item.id}`}
                                    >
                                        {t("edit")}
                                    </a>
                                    <form action={deleteSubItem}>
                                    <input
                                        type="hidden"
                                        name="subItemId"
                                        value={item.id}
                                    />
                                    <ConfirmDeleteButton itemName={item.name} />
                                    </form>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
