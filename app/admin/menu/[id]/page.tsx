import { auth } from "@/auth";
import { formatMenuDate, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { addOptionGroupToMenuItem } from "./actions";

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
        "无介绍";

    return (
        <main style={{ maxWidth: 1000, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>菜单项配置：{displayName}</h1>

                <p>{displayDescription}</p>

                <p>
                    <strong>基础菜品：</strong>
                    {menuItem.mainItem.name}
                </p>

                <p>
                    <strong>基础价格：</strong>
                    {formatPrice(menuItem.mainItem.priceCents)}
                </p>

                <p>
                    <strong>Menu date: </strong>
                    {formatMenuDate(toDateKey(menuItem.availableDate))}
                </p>

                <p>
                    <strong>状态：</strong>
                    {menuItem.isActive ? "显示" : "隐藏"}
                </p>

                <p>
                    <a href="/admin/menu">返回菜单配置</a>
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
                <h2>绑定选项组</h2>

                {optionGroups.length === 0 ? (
                    <p>
                        还没有选项组。请先去{" "}
                        <a href="/admin/option-groups">选项组管理</a>{" "}
                        创建选项组。
                    </p>
                ) : (
                    <form action={addAction}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="optionGroupId">选择选项组</label>

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
                                <option value="">请选择选项组</option>

                                {optionGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}：
                                        {group.isRequired ? "必选" : "非必选"}，
                                        {group.minSelect} - {group.maxSelect}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="sortOrder">在这个菜品中的显示顺序</label>

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

                        <button type="submit">绑定选项组</button>
                    </form>
                )}
            </section>

            <section>
                <h2>当前已绑定选项组</h2>

                {menuItem.optionGroups.length === 0 ? (
                    <p>这个菜单项目前还没有绑定选项组。</p>
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

                                    <p>{group.description || "无说明"}</p>

                                    <p>
                                        <strong>规则：</strong>
                                        {group.isRequired ? "必选" : "非必选"}，
                                        最少选 {group.minSelect} 个，
                                        最多选 {group.maxSelect} 个
                                    </p>

                                    <p>
                                        <strong>在当前菜品中的排序：</strong>
                                        {relation.sortOrder}
                                    </p>

                                    <p>
                                        <strong>选项：</strong>
                                    </p>

                                    {group.options.length === 0 ? (
                                        <p>这个选项组还没有选项。</p>
                                    ) : (
                                        <ul>
                                            {group.options.map((option) => (
                                                <li key={option.id}>
                                                    {option.subItem.name} -{" "}
                                                    {formatPrice(option.priceCents)}
                                                    {option.isDefault
                                                        ? "，默认"
                                                        : ""}
                                                    {!option.isAvailable
                                                        ? "，不可选"
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
