import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MenuItemSelectionClient from "./MenuItemSelectionClient";

/**
 * 把 cents 转换成价格显示。
 */
function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 顾客菜品详情页
 *
 * 路径：
 * GET /menu/[id]
 *
 * 功能：
 * 1. 按 menu_items.id 读取单个真实菜单项
 * 2. 带出基础菜品、选项组、组内选项和 subItem
 * 3. 如果菜单项不存在或不可用，则跳回 /menu
 * 4. 把交互逻辑交给客户端组件处理
 *
 * 为什么这样做：
 * Server Component 负责查数据库，
 * Client Component 负责选项交互和购物车快照。
 */
export default async function MenuItemPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const menuItemId = Number(id);

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
        redirect("/menu");
    }

    const menuItem = await prisma.menuItem.findFirst({
        where: {
            id: menuItemId,
            isActive: true,
            mainItem: {
                isAvailable: true,
            },
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

    if (!menuItem) {
        redirect("/menu");
    }

    const displayName = menuItem.displayName || menuItem.mainItem.name;
    const displayDescription =
        menuItem.displayDescription ||
        menuItem.mainItem.description ||
        "No description.";

    return (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/menu">Back to menu</Link>
                    {" | "}
                    <Link href="/cart">View cart</Link>
                </p>

                <h1 style={{ margin: "0 0 12px" }}>{displayName}</h1>

                <p style={{ color: "#666", margin: "0 0 16px" }}>
                    {displayDescription}
                </p>

                <p
                    style={{
                        fontWeight: "bold",
                        fontSize: 20,
                        margin: 0,
                    }}
                >
                    Base price: {formatPrice(menuItem.mainItem.priceCents)}
                </p>
            </header>

            <section style={{ marginBottom: 32 }}>
                {menuItem.mainItem.imageUrl ? (
                    <img
                        src={menuItem.mainItem.imageUrl}
                        alt={displayName}
                        style={{
                            width: "100%",
                            maxWidth: 520,
                            height: 320,
                            objectFit: "cover",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 520,
                            height: 320,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "#f5f5f5",
                            color: "#999",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        No image
                    </div>
                )}
            </section>

            <section>
                <h2 style={{ marginBottom: 16 }}>Options</h2>

                <MenuItemSelectionClient menuItem={menuItem} />
            </section>
        </main>
    );
}
