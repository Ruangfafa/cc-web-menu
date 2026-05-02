import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createOptionGroup } from "./actions";

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
        <main style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>选项组管理</h1>
                <p>
                    这里管理 option_groups，例如辣度、加购项、饮料选择。
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
                <h2>新增选项组</h2>

                <form action={createOptionGroup}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">选项组名称</label>
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
                        <label htmlFor="description">说明文字</label>
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
                            必选
                        </label>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="minSelect">最少选择数量</label>
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
                        <label htmlFor="maxSelect">最多选择数量</label>
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
                        <label htmlFor="sortOrder">显示顺序</label>
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

                    <button type="submit">新增选项组</button>
                </form>
            </section>

            <section>
                <h2>已有选项组</h2>

                {optionGroups.length === 0 ? (
                    <p>目前还没有选项组。</p>
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

                                <p>{group.description || "无说明"}</p>

                                <p>
                                    <strong>规则：</strong>
                                    {group.isRequired ? "必选" : "非必选"}，
                                    最少选 {group.minSelect} 个，最多选 {group.maxSelect} 个
                                </p>

                                <p>
                                    <strong>排序：</strong>
                                    {group.sortOrder}
                                </p>

                                <p>
                                    <strong>当前选项数量：</strong>
                                    {group.options.length}
                                </p>

                                <p>
                                    <a href={`/admin/option-groups/${group.id}`}>
                                        管理这个选项组的选项
                                    </a>
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}