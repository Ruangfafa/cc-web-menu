import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../../ConfirmDeleteButton";
import {
    addSubItemToOptionGroup,
    deleteOptionGroupItem,
    updateOptionGroup,
} from "./actions";

/**
 * 价格格式化
 *
 * 150 -> $1.50
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 单个选项组详情页
 *
 * 路径：
 * /admin/option-groups/[id]
 *
 * 功能：
 * 1. 查看某个选项组
 * 2. 给这个选项组添加 sub_items
 * 3. 设置每个 sub_item 在这个组里的价格
 */
export default async function AdminOptionGroupDetailPage({
                                                             params,
                                                         }: {
    params: Promise<{ id: string }>;
}) {
    const t = createTranslator(await getLocale());
    /**
     * Next.js 16 中 params 是 Promise，
     * 所以这里需要 await。
     */
    const { id } = await params;
    const optionGroupId = Number(id);

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

    if (!Number.isInteger(optionGroupId) || optionGroupId <= 0) {
        redirect("/admin/option-groups");
    }

    /**
     * 读取当前 option group，
     * 同时带出已经添加进去的 options。
     */
    const optionGroup = await prisma.optionGroup.findUnique({
        where: {
            id: optionGroupId,
        },
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
    });

    if (!optionGroup) {
        redirect("/admin/option-groups");
    }

    /**
     * 读取所有 sub items，
     * 让管理员可以从里面选择一个加入当前 option group。
     */
    const subItems = await prisma.subItem.findMany({
        orderBy: {
            id: "asc",
        },
    });

    /**
     * 绑定 server action 的 optionGroupId 参数。
     */
    const addAction = addSubItemToOptionGroup.bind(null, optionGroupId);
    const updateAction = updateOptionGroup.bind(null, optionGroupId);

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin/option-groups">
                        {t("backToOptionGroups")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>{t("optionGroupDetailTitle", { name: optionGroup.name })}</h1>

                <p>{optionGroup.description || t("noDescription")}</p>

                <p>
                    <strong>{t("rulesLabel")}</strong>
                    {t("groupRules", {
                        type: optionGroup.isRequired
                            ? t("required")
                            : t("optional"),
                        min: optionGroup.minSelect,
                        max: optionGroup.maxSelect,
                    })}
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
                <h2>{t("editOptionGroup")}</h2>

                <form action={updateAction}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="edit-name">{t("name")}</label>
                        <input
                            id="edit-name"
                            name="name"
                            type="text"
                            defaultValue={optionGroup.name}
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
                        <label htmlFor="edit-description">{t("optionGroupDescription")}</label>
                        <textarea
                            id="edit-description"
                            name="description"
                            rows={3}
                            defaultValue={optionGroup.description || ""}
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
                                name="isRequired"
                                type="checkbox"
                                defaultChecked={optionGroup.isRequired}
                            />{" "}
                            {t("isRequired")}
                        </label>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="edit-minSelect">{t("minSelectLabel")}</label>
                        <input
                            id="edit-minSelect"
                            name="minSelect"
                            type="number"
                            min="0"
                            defaultValue={optionGroup.minSelect}
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
                        <label htmlFor="edit-maxSelect">{t("maxSelectLabel")}</label>
                        <input
                            id="edit-maxSelect"
                            name="maxSelect"
                            type="number"
                            min="0"
                            defaultValue={optionGroup.maxSelect}
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
                        <label htmlFor="edit-sortOrder">{t("sortOrder")}</label>
                        <input
                            id="edit-sortOrder"
                            name="sortOrder"
                            type="number"
                            defaultValue={optionGroup.sortOrder}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <button
                        className="menu-action-button menu-action-button-primary"
                        type="submit"
                    >
                        {t("saveChanges")}
                    </button>
                </form>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("addSubItemToOptionGroup")}</h2>

                {subItems.length === 0 ? (
                    <p>
                        {t("noSubItemsForOptionGroup")}{" "}
                        <a href="/admin/sub-items">{t("goToSubItems")}</a>。
                    </p>
                ) : (
                    <form action={addAction}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="subItemId">{t("selectSubItem")}</label>

                            <select
                                id="subItemId"
                                name="subItemId"
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            >
                                <option value="">{t("selectSubItemPlaceholder")}</option>

                                {subItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="priceDollars">
                                {t("optionPriceInGroup")}
                            </label>

                            <input
                                id="priceDollars"
                                name="priceDollars"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue="0"
                                required
                                placeholder="例如：1.50"
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
                            <label>
                                <input name="isDefault" type="checkbox" />{" "}
                                {t("isDefaultSelected")}
                            </label>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label>
                                <input
                                    name="isAvailable"
                                    type="checkbox"
                                    defaultChecked
                                />{" "}
                                {t("isAvailable")}
                            </label>
                        </div>

                        <button type="submit">
                            {t("addToOptionGroup")}
                        </button>
                    </form>
                )}
            </section>

            <section>
                <h2>{t("currentOptionsInGroup")}</h2>

                {optionGroup.options.length === 0 ? (
                    <p>{t("noOptionGroupItems")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {optionGroup.options.map((option) => (
                            <article
                                key={option.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 16,
                                }}
                            >
                                <h3>{option.subItem.name}</h3>

                                <p>
                                    <strong>{t("price")}</strong>
                                    {formatPrice(option.priceCents)}
                                </p>

                                <p>
                                    <strong>{t("defaultSelected")}</strong>
                                    {option.isDefault ? t("yes") : t("no")}
                                </p>

                                <p>
                                    <strong>{t("status")}</strong>
                                    {option.isAvailable
                                        ? t("available")
                                        : t("unavailable")}
                                </p>

                                <p>
                                    <strong>{t("sortOrder")}:</strong>
                                    {option.sortOrder}
                                </p>
                                <form action={deleteOptionGroupItem}>
                                    <input
                                        type="hidden"
                                        name="optionGroupId"
                                        value={optionGroup.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="optionGroupItemId"
                                        value={option.id}
                                    />
                                    <ConfirmDeleteButton
                                        itemName={option.subItem.name}
                                    />
                                </form>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
