import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { createMainItem, deleteMainItem } from "./actions";

/**
 * 把 cents 转成价格显示
 *
 * 1299 -> $12.99
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 基础菜品管理页面
 *
 * 路径：
 * /admin/general-items
 *
 * 功能：
 * 1. 管理员新增基础菜品
 * 2. 显示 general_items 表里的基础菜品
 *
 * 注意：
 * 这个页面只管理 MainItem。
 * 不管理 MenuItem。
 */
export default async function AdminGeneralItemsPage() {
    const t = createTranslator(await getLocale());
    /**
     * 1. 检查管理员权限
     */
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    /**
     * 2. 读取所有基础菜品
     */
    const mainItems = await prisma.mainItem.findMany({
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
                <h1>{t("generalItemManagement")}</h1>
                <p>{t("generalItemsAdminDesc")}</p>

            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("addGeneralItem")}</h2>

                <form action={createMainItem}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">{t("dishName")}</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="description">{t("dishDescription")}</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="priceDollars">{t("basePrice")}</label>
                        <input
                            id="priceDollars"
                            name="priceDollars"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="12.99"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="imageUrl">{t("imageUrl")}</label>
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            type="text"
                            placeholder="可选"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label>
                            <input
                                name="isAvailable"
                                type="checkbox"
                                defaultChecked
                            />{" "}
                            {t("available")}
                        </label>
                    </div>

                    <button type="submit">
                        {t("addGeneralItem")}
                    </button>
                </form>
            </section>

            <section>
                <h2>{t("existingGeneralItems")}</h2>

                {mainItems.length === 0 ? (
                    <p>{t("noGeneralItems")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {mainItems.map((item) => (
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
                                    {item.description || t("noDescription")}
                                </p>

                                <p>
                                    <strong>{t("price")}</strong>
                                    {formatPrice(item.priceCents)}
                                </p>

                                <p>
                                    <strong>{t("status")}</strong>
                                    {item.isAvailable ? t("available") : t("unavailable")}
                                </p>

                                {item.imageUrl && (
                                    <p>
                                        <strong>{t("image")}</strong>
                                        {item.imageUrl}
                                    </p>
                                )}
                                <div className="admin-item-actions">
                                    <a
                                        className="menu-action-button"
                                        href={`/admin/general-items/${item.id}`}
                                    >
                                        {t("edit")}
                                    </a>
                                    <form action={deleteMainItem}>
                                    <input
                                        type="hidden"
                                        name="mainItemId"
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
