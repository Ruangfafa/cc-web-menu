import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatMenuDate, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../../ConfirmDeleteButton";
import {
    addOptionGroupToMenuItem,
    deleteMenuItemOptionGroup,
} from "./actions";

/**
 * 价格格式化
 *
 * 1299 -> $12.99
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 单个菜单项配置页面
 *
 * 路径：
 * /admin/menu/[id]
 *
 * 功能：
 * 1. 查看某个 menu_item
 * 2. 给这个 menu_item 绑定 option_group
 * 3. 查看当前已经绑定的 option_group
 */
export default async function AdminMenuItemDetailPage({
                                                          params,
                                                      }: {
    params: Promise<{ id: string }>;
}) {
    const t = createTranslator(await getLocale());
    /**
     * Next.js 16 中 params 是 Promise
     */
    const { id } = await params;
    const menuItemId = Number(id);

    /**
     * 检查管理员权限
     */
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
        redirect("/admin/menu");
    }

    /**
     * 读取当前菜单项
     */
    const menuItem = await prisma.menuItem.findUnique({
        where: {
            id: menuItemId,
        },
        include: {
            mainItem: true,
            optionGroups: {
                orderBy: [
                    {
                        sortOrder: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
                include: {
                    optionGroup: {
                        include: {
                            options: {
                                orderBy: [
                                    {
                                        sortOrder: "asc",
                                    },
                                    {
                                        id: "asc",
                                    },
                                ],
                                include: {
                                    subItem: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!menuItem) {
        redirect("/admin/menu");
    }

    /**
     * 读取所有 option groups，
     * 让管理员选择一个绑定到当前菜单项。
     */
    const optionGroups = await prisma.optionGroup.findMany({
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                id: "asc",
            },
        ],
    });

    /**
     * 绑定 server action 的 menuItemId
     */
    const addAction = addOptionGroupToMenuItem.bind(null, menuItemId);

    const displayName = menuItem.displayName || menuItem.mainItem.name;
    const displayDescription =
        menuItem.displayDescription ||
        menuItem.mainItem.description ||
        t("noDescription");

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin/menu">
                        {t("backToMenuConfig")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>{t("menuItemConfigTitle", { name: displayName })}</h1>

                <p>{displayDescription}</p>

                <p>
                    <strong>{t("baseDish")}</strong>
                    {menuItem.mainItem.name}
                </p>

                <p>
                    <strong>{t("basePrice")}:</strong>
                    {formatPrice(menuItem.mainItem.priceCents)}
                </p>

                <p>
                    <strong>{t("menuDateLabel")} </strong>
                    {formatMenuDate(toDateKey(menuItem.availableDate))}
                </p>

                <p>
                    <strong>{t("status")}</strong>
                    {menuItem.isActive ? t("active") : t("inactive")}
                </p>

            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("bindOptionGroup")}</h2>

                {optionGroups.length === 0 ? (
                    <p>
                        {t("noOptionGroupsForBinding")}{" "}
                        <a href="/admin/option-groups">
                            {t("goCreateOptionGroup")}
                        </a>
                    </p>
                ) : (
                    <form action={addAction}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="optionGroupId">{t("selectOptionGroup")}</label>

                            <select
                                id="optionGroupId"
                                name="optionGroupId"
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            >
                                <option value="">{t("selectOptionGroupPlaceholder")}</option>

                                {optionGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}:{" "}
                                        {group.isRequired ? t("required") : t("optional")}{" "}
                                        {group.minSelect} - {group.maxSelect}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="sortOrder">{t("sortOrderInMenuItem")}</label>

                            <input
                                id="sortOrder"
                                name="sortOrder"
                                type="number"
                                defaultValue={0}
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <button type="submit">{t("bindOptionGroupButton")}</button>
                    </form>
                )}
            </section>

            <section>
                <h2>{t("currentBoundOptionGroups")}</h2>

                {menuItem.optionGroups.length === 0 ? (
                    <p>{t("noBoundOptionGroups")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {menuItem.optionGroups.map((relation) => {
                            const group = relation.optionGroup;

                            return (
                                <article
                                    key={relation.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 8,
                                        padding: 16,
                                    }}
                                >
                                    <h3>{group.name}</h3>

                                    <p>{group.description || t("noDescription")}</p>

                                    <p>
                                        <strong>{t("rulesLabel")}</strong>
                                        {t("groupRules", {
                                            type: group.isRequired
                                                ? t("required")
                                                : t("optional"),
                                            min: group.minSelect,
                                            max: group.maxSelect,
                                        })}
                                    </p>

                                    <p>
                                        <strong>{t("sortOrderInMenuItem")}:</strong>
                                        {relation.sortOrder}
                                    </p>
                                    <form action={deleteMenuItemOptionGroup}>
                                        <input
                                            type="hidden"
                                            name="menuItemId"
                                            value={menuItem.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="menuItemOptionGroupId"
                                            value={relation.id}
                                        />
                                        <ConfirmDeleteButton itemName={group.name} />
                                    </form>

                                    <p>
                                        <strong>{t("optionsLabel")}</strong>
                                    </p>

                                    {group.options.length === 0 ? (
                                        <p>{t("noOptionsYet")}</p>
                                    ) : (
                                        <ul>
                                            {group.options.map((option) => (
                                                <li key={option.id}>
                                                    {option.subItem.name} -{" "}
                                                    {formatPrice(option.priceCents)}
                                                    {option.isDefault
                                                        ? `, ${t("default")}`
                                                        : ""}
                                                    {!option.isAvailable
                                                        ? `, ${t("unavailable")}`
                                                        : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
