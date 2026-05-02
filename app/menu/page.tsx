import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 把 cents 转换成价格显示
 *
 * 1299 -> $12.99
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 顾客菜单页面
 *
 * 路径：
 * GET /menu
 *
 * 功能：
 * 1. 顶部显示登录状态
 * 2. 从 menu_items 读取真正菜单
 * 3. 显示基础菜品信息
 * 4. 显示每个菜单项绑定的选项组
 * 5. 显示每个选项组里的选项和价格
 *
 * 注意：
 * 现在还不做购物车。
 * 当前目标是确认后台配置的数据能正确显示到顾客菜单页。
 */
export default async function MenuPage() {
    /**
     * 1. 读取当前登录状态
     */
    const session = await auth();

    /**
     * 2. 读取真正菜单项
     *
     * 现在不直接读取 general_items。
     *
     * 读取逻辑：
     * - menuItem.isActive = true
     * - mainItem.isAvailable = true
     *
     * include:
     * - mainItem：基础菜品信息
     * - optionGroups：这个菜单项绑定的选项组
     * - optionGroup.options：选项组里的具体选项
     * - option.subItem：选项名称
     */
    const menuItems = await prisma.menuItem.findMany({
        where: {
            isActive: true,
            mainItem: {
                isAvailable: true,
            },
        },
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                id: "asc",
            },
        ],
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
                                where: {
                                    isAvailable: true,
                                },
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

    return (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
            {/**
             * 顶部用户状态栏
             */}
            <section
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    marginBottom: 32,
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    background: "#fafafa",
                }}
            >
                {session?.user ? (
                    <>
                        <p style={{ margin: 0 }}>
                            <strong>{session.user.name || "用户"}</strong>
                            ，您好！
                        </p>

                        <div style={{ display: "flex", gap: 10 }}>
                            <a href="/account">账户</a>

                            {(session.user as any).role === "ADMIN" && (
                                <a href="/admin">管理后台</a>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ margin: 0 }}>
                            <strong>未登录</strong>
                        </p>

                        <div style={{ display: "flex", gap: 10 }}>
                            <a href="/login">登录</a>
                            <a href="/register">注册</a>
                        </div>
                    </>
                )}
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>C&C Kitchen Menu</h1>
                <p style={{ color: "#666" }}>
                    Browse our available menu items.
                </p>
            </header>

            <section>
                <h2>Menu Items</h2>

                {menuItems.length === 0 ? (
                    <p style={{ color: "#666" }}>
                        当前还没有可显示的菜单项。请先在后台配置菜单。
                    </p>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 16,
                            marginTop: 16,
                        }}
                    >
                        {menuItems.map((menuItem) => {
                            const displayName =
                                menuItem.displayName ||
                                menuItem.mainItem.name;

                            const displayDescription =
                                menuItem.displayDescription ||
                                menuItem.mainItem.description ||
                                "No description.";

                            return (
                                <article
                                    key={menuItem.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 10,
                                        padding: 16,
                                        background: "#fff",
                                    }}
                                >
                                    {menuItem.mainItem.imageUrl ? (
                                        <img
                                            src={menuItem.mainItem.imageUrl}
                                            alt={displayName}
                                            style={{
                                                width: "100%",
                                                height: 160,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                                marginBottom: 12,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 160,
                                                borderRadius: 8,
                                                marginBottom: 12,
                                                background: "#f2f2f2",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#999",
                                            }}
                                        >
                                            No Image
                                        </div>
                                    )}

                                    <h3 style={{ margin: "0 0 8px" }}>
                                        {displayName}
                                    </h3>

                                    <p
                                        style={{
                                            color: "#666",
                                            margin: "0 0 12px",
                                        }}
                                    >
                                        {displayDescription}
                                    </p>

                                    <p
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: 18,
                                            margin: "0 0 16px",
                                        }}
                                    >
                                        {formatPrice(
                                            menuItem.mainItem.priceCents
                                        )}
                                    </p>

                                    {menuItem.optionGroups.length === 0 ? (
                                        <p style={{ color: "#666" }}>
                                            这个菜品没有额外选项。
                                        </p>
                                    ) : (
                                        <div>
                                            <h4>Options</h4>

                                            {menuItem.optionGroups.map(
                                                (relation) => {
                                                    const group =
                                                        relation.optionGroup;

                                                    return (
                                                        <section
                                                            key={relation.id}
                                                            style={{
                                                                marginTop: 12,
                                                                paddingTop: 12,
                                                                borderTop:
                                                                    "1px solid #eee",
                                                            }}
                                                        >
                                                            <p
                                                                style={{
                                                                    fontWeight:
                                                                        "bold",
                                                                    margin:
                                                                        "0 0 4px",
                                                                }}
                                                            >
                                                                {group.name}
                                                            </p>

                                                            <p
                                                                style={{
                                                                    color:
                                                                        "#666",
                                                                    margin:
                                                                        "0 0 8px",
                                                                }}
                                                            >
                                                                {group.isRequired
                                                                    ? "必选"
                                                                    : "可选"}
                                                                ，最少选{" "}
                                                                {
                                                                    group.minSelect
                                                                }{" "}
                                                                个，最多选{" "}
                                                                {
                                                                    group.maxSelect
                                                                }{" "}
                                                                个
                                                            </p>

                                                            {group.description && (
                                                                <p
                                                                    style={{
                                                                        color:
                                                                            "#666",
                                                                        margin:
                                                                            "0 0 8px",
                                                                    }}
                                                                >
                                                                    {
                                                                        group.description
                                                                    }
                                                                </p>
                                                            )}

                                                            {group.options
                                                                .length ===
                                                            0 ? (
                                                                <p
                                                                    style={{
                                                                        color:
                                                                            "#999",
                                                                    }}
                                                                >
                                                                    这个选项组暂无可选项。
                                                                </p>
                                                            ) : (
                                                                <ul>
                                                                    {group.options.map(
                                                                        (
                                                                            option
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    option.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                        .subItem
                                                                                        .name
                                                                                }{" "}
                                                                                -{" "}
                                                                                {formatPrice(
                                                                                    option.priceCents
                                                                                )}
                                                                                {option.isDefault
                                                                                    ? "，默认"
                                                                                    : ""}
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </section>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}

                                    {/**
                                     * 先进入单个菜品详情页。
                                     *
                                     * 为什么这样改：
                                     * 后续购物车的选择逻辑会依赖 /menu/[id]，
                                     * 所以当前列表页先把入口接过去。
                                     */}
                                    <a
                                        href={`/menu/${menuItem.id}`}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: 6,
                                            border: "1px solid #ccc",
                                            background: "#f7f7f7",
                                            color: "#111",
                                            textAlign: "center",
                                            textDecoration: "none",
                                            marginTop: 16,
                                        }}
                                    >
                                        选择 / View Details
                                    </a>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
