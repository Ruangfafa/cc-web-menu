import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createMainItem } from "./actions";

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
        <main style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>基础菜品管理</h1>
                <p>这里管理 general_items，也就是基础商品库。</p>

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
                <h2>新增基础菜品</h2>

                <form action={createMainItem}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">菜品名称</label>
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
                        <label htmlFor="description">菜品介绍</label>
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
                        <label htmlFor="priceDollars">基础价格</label>
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
                        <label htmlFor="imageUrl">图片 URL</label>
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
                            可用
                        </label>
                    </div>

                    <button type="submit">
                        新增基础菜品
                    </button>
                </form>
            </section>

            <section>
                <h2>已有基础菜品</h2>

                {mainItems.length === 0 ? (
                    <p>目前还没有基础菜品。</p>
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
                                    {item.description || "无介绍"}
                                </p>

                                <p>
                                    <strong>价格：</strong>
                                    {formatPrice(item.priceCents)}
                                </p>

                                <p>
                                    <strong>状态：</strong>
                                    {item.isAvailable ? "可用" : "不可用"}
                                </p>

                                {item.imageUrl && (
                                    <p>
                                        <strong>图片：</strong>
                                        {item.imageUrl}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}