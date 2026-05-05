import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { createOptionGroup, deleteOptionGroup } from "./actions";

/**
 * 选项组管理页面
 *
 * 路径：
 * /admin/option-groups
 *
 * 功能：
 * 1. 创建选项组
 * 2. 查看已有选项组
 *
 * 注意：
 * 这个页面暂时只创建 OptionGroup。
 * 下一步才会把 SubItem 加入 OptionGroup。
 */
export default async function AdminOptionGroupsPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    const optionGroups = await prisma.optionGroup.findMany({
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                id: "asc",
            },
        ],
        include: {
            options: {
                include: {
                    subItem: true,
                },
                orderBy: {
                    sortOrder: "asc",
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
            <header style={{ marginBottom: 32 }}>
                <h1>{t("optionGroupManagement")}</h1>
                <p>{t("optionGroupsAdminDesc")}</p>

            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 40,
                }}
            >
                <h2>{t("addOptionGroup")}</h2>

                <form action={createOptionGroup}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">{t("optionGroupName")}</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="例如：辣度、加购项、饮料选择"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="description">{t("optionGroupDescription")}</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="例如：请选择一个辣度"
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
                            <input name="isRequired" type="checkbox" />{" "}
                            {t("isRequired")}
                        </label>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="minSelect">{t("minSelectLabel")}</label>
                        <input
                            id="minSelect"
                            name="minSelect"
                            type="number"
                            min="0"
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
                        <label htmlFor="maxSelect">{t("maxSelectLabel")}</label>
                        <input
                            id="maxSelect"
                            name="maxSelect"
                            type="number"
                            min="0"
                            defaultValue={1}
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
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <button type="submit">{t("addOptionGroup")}</button>
                </form>
            </section>

            <section>
                <h2>{t("existingOptionGroups")}</h2>

                {optionGroups.length === 0 ? (
                    <p>{t("noOptionGroups")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {optionGroups.map((group) => (
                            <article
                                key={group.id}
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
                                    <strong>{t("sortOrder")}:</strong>
                                    {group.sortOrder}
                                </p>

                                <p>
                                    <strong>{t("currentOptionCount")}</strong>
                                    {group.options.length}
                                </p>

                                <div className="admin-item-actions">
                                    <a
                                        className="menu-action-button"
                                        href={`/admin/option-groups/${group.id}`}
                                    >
                                        {t("edit")}
                                    </a>
                                    <form action={deleteOptionGroup}>
                                    <input
                                        type="hidden"
                                        name="optionGroupId"
                                        value={group.id}
                                    />
                                    <ConfirmDeleteButton itemName={group.name} />
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
