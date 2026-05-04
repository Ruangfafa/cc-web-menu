import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { createSubItem, deleteSubItem } from "./actions";

/**
 * 附属项管理页面
 *
 * 路径：
 * /admin/sub-items
 *
 * 功能：
 * 1. 管理员新增附属项
 * 2. 显示 sub_items 表里的附属项
 *
 * 注意：
 * 这里不设置价格。
 * 价格以后在菜单配置里的 option_group_items 设置。
 */
export default async function AdminSubItemsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    const subItems = await prisma.subItem.findMany({
        orderBy: {
            id: "asc",
        },
    });

    return (
        <main style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>附属项管理</h1>
                <p>这里管理 sub_items，也就是附属项库。</p>

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
                <h2>新增附属项</h2>

                <form action={createSubItem}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">附属项名称</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="例如：加饭、加蛋、微辣、可乐"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <button type="submit">新增附属项</button>
                </form>
            </section>

            <section>
                <h2>已有附属项</h2>

                {subItems.length === 0 ? (
                    <p>目前还没有附属项。</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {subItems.map((item) => (
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
                                    <strong>ID：</strong>
                                    {item.id}
                                </p>
                                <form action={deleteSubItem}>
                                    <input
                                        type="hidden"
                                        name="subItemId"
                                        value={item.id}
                                    />
                                    <ConfirmDeleteButton itemName={item.name} />
                                </form>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
