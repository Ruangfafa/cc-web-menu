import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { addSubItemToOptionGroup } from "./actions";

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

    return (
        <main style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 32 }}>
                <h1>选项组详情：{optionGroup.name}</h1>

                <p>{optionGroup.description || "无说明"}</p>

                <p>
                    <strong>规则：</strong>
                    {optionGroup.isRequired ? "必选" : "非必选"}，最少选{" "}
                    {optionGroup.minSelect} 个，最多选 {optionGroup.maxSelect} 个
                </p>

                <p>
                    <a href="/admin/option-groups">返回选项组管理</a>
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
                <h2>添加附属项到这个选项组</h2>

                {subItems.length === 0 ? (
                    <p>
                        还没有附属项。请先去{" "}
                        <a href="/admin/sub-items">附属项管理</a> 添加。
                    </p>
                ) : (
                    <form action={addAction}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="subItemId">选择附属项</label>

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
                                <option value="">请选择附属项</option>

                                {subItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="priceDollars">
                                这个选项在本组里的价格
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

                        <div style={{ marginBottom: 16 }}>
                            <label>
                                <input name="isDefault" type="checkbox" />{" "}
                                默认选中
                            </label>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label>
                                <input
                                    name="isAvailable"
                                    type="checkbox"
                                    defaultChecked
                                />{" "}
                                可选
                            </label>
                        </div>

                        <button type="submit">
                            添加到选项组
                        </button>
                    </form>
                )}
            </section>

            <section>
                <h2>当前选项组里的选项</h2>

                {optionGroup.options.length === 0 ? (
                    <p>这个选项组目前还没有选项。</p>
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
                                    <strong>价格：</strong>
                                    {formatPrice(option.priceCents)}
                                </p>

                                <p>
                                    <strong>默认选中：</strong>
                                    {option.isDefault ? "是" : "否"}
                                </p>

                                <p>
                                    <strong>状态：</strong>
                                    {option.isAvailable ? "可选" : "不可选"}
                                </p>

                                <p>
                                    <strong>排序：</strong>
                                    {option.sortOrder}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}