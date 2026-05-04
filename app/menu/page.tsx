import { auth } from "@/auth";
import {
    formatMenuDate,
    parseDateKey,
    todayDateKey,
    toDateKey,
} from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

/**
 * 把 cents 转换成价格显示。
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
 * 5. 提供进入详情页和购物车的入口
 *
 * 为什么这样做：
 * 顾客端必须以 menu_items 为中心读取数据，
 * 不能直接把 general_items 当成最终菜单。
 */
export default async function MenuPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { date } = await searchParams;
    const session = await auth();
    const todayKey = todayDateKey();
    const requestedDateKey = date || todayKey;
    const requestedDate = parseDateKey(requestedDateKey);
    const selectedDateKey =
        requestedDate && requestedDateKey >= todayKey ? requestedDateKey : todayKey;
    const selectedDate = parseDateKey(selectedDateKey) || new Date();
    const todayDate = parseDateKey(todayKey) || new Date();

    const availableMenuDates = await prisma.menuItem.findMany({
        where: {
            isActive: true,
            availableDate: {
                gte: todayDate,
            },
            mainItem: {
                isAvailable: true,
            },
        },
        distinct: ["availableDate"],
        orderBy: {
            availableDate: "asc",
        },
        select: {
            availableDate: true,
        },
    });
    const menuDateOptions = availableMenuDates.map((item) =>
        toDateKey(item.availableDate)
    );

    const menuItems = await prisma.menuItem.findMany({
        where: {
            isActive: true,
            availableDate: selectedDate,
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
                            <Link href="/cart">购物车</Link>
                            <Link href="/account">账户</Link>

                            {(session.user as { role?: string }).role ===
                                "ADMIN" && <Link href="/admin">管理后台</Link>}
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ margin: 0 }}>
                            <strong>未登录</strong>
                        </p>

                        <div style={{ display: "flex", gap: 10 }}>
                            <Link href="/cart">购物车</Link>
                            <Link href="/login">登录</Link>
                            <Link href="/register">注册</Link>
                        </div>
                    </>
                )}
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>C&C Kitchen Menu</h1>
                <p style={{ color: "#666" }}>
                    Showing menu for {formatMenuDate(selectedDateKey)}.
                </p>
            </header>

            <section style={{ marginBottom: 28 }}>
                <h2>Choose Menu Date</h2>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[todayKey, ...menuDateOptions]
                        .filter(
                            (value, index, values) =>
                                values.indexOf(value) === index
                        )
                        .map((dateKey) => {
                            const isSelected = dateKey === selectedDateKey;

                            return (
                                <Link
                                    key={dateKey}
                                    href={`/menu?date=${dateKey}`}
                                    style={{
                                        display: "inline-block",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: isSelected
                                            ? "1px solid #111"
                                            : "1px solid #ccc",
                                        background: isSelected ? "#111" : "#fff",
                                        color: isSelected ? "#fff" : "#111",
                                        textDecoration: "none",
                                    }}
                                >
                                    {formatMenuDate(dateKey)}
                                </Link>
                            );
                        })}
                </div>
            </section>

            <section>
                <h2>Menu Items</h2>

                {menuItems.length === 0 ? (
                    <p style={{ color: "#666" }}>
                        No active menu items for{" "}
                        {formatMenuDate(selectedDateKey)}.
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

                                    <Link
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
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
