import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatMenuDate, todayDateKey, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { createMenuItem, deleteMenuItem } from "./actions";

/**
 * 价格格式化
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 管理员菜单配置页面
 *
 * 路径：
 * /admin/menu
 *
 * 当前阶段功能：
 * 1. 从 general_items 选择基础菜品
 * 2. 创建 menu_items
 * 3. 显示已有 menu_items
 *
 * 下一阶段才会加入：
 * - option_groups
 * - option_group_items
 * - menu_item_option_groups
 */
export default async function AdminMenuPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();
    const todayKey = todayDateKey();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    /**
     * 基础菜品库
     *
     * 这里只列出可用基础菜品。
     */
    const mainItems = await prisma.mainItem.findMany({
        where: {
            isAvailable: true,
        },
        orderBy: {
            id: "asc",
        },
    });

    /**
     * 已经配置到菜单里的菜品
     */
    const menuItems = await prisma.menuItem.findMany({
        orderBy: [
            {
                availableDate: "asc",
            },
            {
                sortOrder: "asc",
            },
            {
                id: "asc",
            },
        ],
        include: {
            mainItem: true,
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
                <h1>{t("menuConfiguration")}</h1>

                <p>{t("menuConfigurationAdminDesc")}</p>

            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("addMenuItemToMenu")}</h2>

                {mainItems.length === 0 ? (
                    <p>
                        {t("noAvailableGeneralItems")}{" "}
                        <a href="/admin/general-items">{t("goToGeneralItems")}</a>
                        。
                    </p>
                ) : (
                    <form action={createMenuItem}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="mainItemId">
                                {t("selectGeneralItem")}
                            </label>

                            <select
                                id="mainItemId"
                                name="mainItemId"
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            >
                                <option value="">
                                    {t("selectGeneralItemPlaceholder")}
                                </option>

                                {mainItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} -{" "}
                                        {formatPrice(item.priceCents)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="displayName">
                                {t("menuDisplayNameOptional")}
                            </label>

                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                placeholder={t("menuDisplayNamePlaceholder")}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="displayDescription">
                                {t("menuDisplayDescriptionOptional")}
                            </label>

                            <textarea
                                id="displayDescription"
                                name="displayDescription"
                                rows={3}
                                placeholder={t("menuDisplayDescriptionPlaceholder")}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="availableDate">{t("availableDateLabel")}</label>

                            <input
                                id="availableDate"
                                name="availableDate"
                                type="date"
                                defaultValue={todayKey}
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
                            <label htmlFor="sortOrder">{t("sortOrder")}</label>

                            <input
                                id="sortOrder"
                                name="sortOrder"
                                type="number"
                                defaultValue={0}
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
                                    name="isActive"
                                    type="checkbox"
                                    defaultChecked
                                />{" "}
                                {t("showOnMenu")}
                            </label>
                        </div>

                        <button type="submit">
                            {t("addToMenu")}
                        </button>
                    </form>
                )}
            </section>

            <section>
                <h2>{t("existingMenuItems")}</h2>

                {menuItems.length === 0 ? (
                    <p>{t("noMenuItemsAdmin")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {menuItems.map((item) => {
                            const displayName =
                                item.displayName || item.mainItem.name;

                            const displayDescription =
                                item.displayDescription ||
                                item.mainItem.description ||
                                t("noDescription");

                            return (
                                <article
                                    key={item.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 8,
                                        padding: 16,
                                    }}
                                >
                                    <h3>{displayName}</h3>

                                    <p>{displayDescription}</p>

                                    <p>
                                        <strong>{t("baseDish")}</strong>
                                        {item.mainItem.name}
                                    </p>

                                    <p>
                                        <strong>{t("basePrice")}:</strong>
                                        {formatPrice(item.mainItem.priceCents)}
                                    </p>

                                    <p>
                                        <strong>{t("menuDateLabel")} </strong>
                                        {formatMenuDate(
                                            toDateKey(item.availableDate)
                                        )}
                                    </p>

                                    <p>
                                        <strong>{t("sortOrder")}:</strong>
                                        {item.sortOrder}
                                    </p>

                                    <p>
                                        <strong>{t("status")}</strong>
                                        {item.isActive
                                            ? t("active")
                                            : t("inactive")}
                                    </p>

                                    <div className="admin-item-actions">
                                        <a
                                            className="menu-action-button"
                                            href={`/admin/menu/${item.id}`}
                                        >
                                            {t("configureMenuItemOptions")}
                                        </a>
                                        <form action={deleteMenuItem}>
                                        <input
                                            type="hidden"
                                            name="menuItemId"
                                            value={item.id}
                                        />
                                        <ConfirmDeleteButton
                                            itemName={displayName}
                                        />
                                        </form>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
