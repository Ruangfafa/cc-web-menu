import { auth } from "@/auth";
import { formatMenuDate, todayDateKey, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
        <main style={{ maxWidth: 1000, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>菜单配置</h1>

                <p>
                    这里管理真正显示给顾客的 menu_items。
                    基础菜品来自 general_items。
                </p>

                <p>
                    <a href="/admin">返回 Admin Dashboard</a>
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
                <h2>添加菜品到菜单</h2>

                {mainItems.length === 0 ? (
                    <p>
                        还没有可用的基础菜品。请先去{" "}
                        <a href="/admin/general-items">基础菜品管理</a>{" "}
                        添加菜品。
                    </p>
                ) : (
                    <form action={createMenuItem}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="mainItemId">
                                选择基础菜品
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
                                    请选择基础菜品
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
                                菜单显示名，可选
                            </label>

                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                placeholder="为空则使用基础菜品名称"
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
                                菜单显示描述，可选
                            </label>

                            <textarea
                                id="displayDescription"
                                name="displayDescription"
                                rows={3}
                                placeholder="为空则使用基础菜品介绍"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="availableDate">Menu date</label>

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
                            <label htmlFor="sortOrder">显示顺序</label>

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
                                显示在菜单
                            </label>
                        </div>

                        <button type="submit">
                            添加到菜单
                        </button>
                    </form>
                )}
            </section>

            <section>
                <h2>已有菜单项</h2>

                {menuItems.length === 0 ? (
                    <p>目前还没有菜单项。</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {menuItems.map((item) => {
                            const displayName =
                                item.displayName || item.mainItem.name;

                            const displayDescription =
                                item.displayDescription ||
                                item.mainItem.description ||
                                "无介绍";

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
                                        <strong>基础菜品：</strong>
                                        {item.mainItem.name}
                                    </p>

                                    <p>
                                        <strong>基础价格：</strong>
                                        {formatPrice(item.mainItem.priceCents)}
                                    </p>

                                    <p>
                                        <strong>Menu date: </strong>
                                        {formatMenuDate(
                                            toDateKey(item.availableDate)
                                        )}
                                    </p>

                                    <p>
                                        <strong>排序：</strong>
                                        {item.sortOrder}
                                    </p>

                                    <p>
                                        <strong>状态：</strong>
                                        {item.isActive
                                            ? "显示"
                                            : "隐藏"}
                                    </p>

                                    <p>
                                        <a href={`/admin/menu/${item.id}`}>
                                            配置这个菜单项的选项组
                                        </a>
                                    </p>
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
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
