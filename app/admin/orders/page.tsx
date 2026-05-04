import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveOrderComment } from "./actions";
import { OrderStatusForm } from "./OrderStatusForm";

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * 管理员订单管理页
 *
 * 路径：
 * GET /admin/orders
 *
 * 功能：
 * 1. 查看订单列表
 * 2. 查看顾客信息和菜品快照
 * 3. 直接修改订单状态
 */
export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ conflict?: string }>;
}) {
    const { conflict } = await searchParams;
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }

    const orders = await prisma.order.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
            user: true,
            items: {
                include: {
                    options: true,
                },
            },
        },
    });

    return (
        <main style={{ maxWidth: 1100, margin: "60px auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/admin">Back to admin</Link>
                </p>

                <h1 style={{ margin: "0 0 8px" }}>Order Management</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    View and update customer orders.
                </p>
            </header>

            {conflict === "1" && (
                <p
                    style={{
                        border: "1px solid #f0c36d",
                        borderRadius: 8,
                        padding: 12,
                        background: "#fff8e5",
                        color: "#7a4b00",
                        margin: "0 0 16px",
                    }}
                >
                    订单已被其他管理员更新，请刷新后再改。
                </p>
            )}

            {orders.length === 0 ? (
                <p style={{ color: "#666" }}>No orders found.</p>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {orders.map((order) => (
                        <article
                            key={order.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 10,
                                padding: 16,
                                background: "#fff",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    flexWrap: "wrap",
                                    marginBottom: 16,
                                }}
                            >
                                <div>
                                    <p style={{ margin: "0 0 8px" }}>
                                        <strong>Order #{order.id}</strong>
                                    </p>

                                    <p style={{ margin: "0 0 8px", color: "#666" }}>
                                        Created: {order.createdAt.toLocaleString()}
                                    </p>

                                    {order.pickupTime && (
                                        <p
                                            style={{
                                                margin: "0 0 8px",
                                                color: "#666",
                                            }}
                                        >
                                            Pickup:{" "}
                                            {order.pickupTime.toLocaleString()}
                                        </p>
                                    )}

                                    <p style={{ margin: 0 }}>
                                        Total: {formatPrice(order.totalCents)}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gap: 10,
                                        minWidth: 320,
                                    }}
                                >
                                    <OrderStatusForm
                                        orderId={order.id}
                                        updatedAt={order.updatedAt.toISOString()}
                                        paymentStatus={order.paymentStatus}
                                        fulfillmentStatus={order.fulfillmentStatus}
                                    />

                                    <form action={saveOrderComment}>
                                        <input
                                            type="hidden"
                                            name="orderId"
                                            value={order.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="updatedAt"
                                            value={order.updatedAt.toISOString()}
                                        />

                                        <label htmlFor={`comment-${order.id}`}>
                                            Comment
                                            <textarea
                                                id={`comment-${order.id}`}
                                                name="comment"
                                                defaultValue={order.comment || ""}
                                                placeholder="Add internal notes"
                                                rows={3}
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    marginTop: 4,
                                                    resize: "vertical",
                                                }}
                                            />
                                        </label>

                                        <button
                                            type="submit"
                                            style={{ marginTop: 8, width: "100%" }}
                                        >
                                            Save
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <section style={{ marginBottom: 16 }}>
                                <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                                    Customer
                                </h2>

                                {order.user ? (
                                    <>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>User:</strong> {order.user.name} (
                                            {order.user.email})
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>Phone:</strong> {order.user.phone}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>Guest:</strong>{" "}
                                            {order.guestName || "Unknown"}
                                        </p>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>Phone:</strong>{" "}
                                            {order.guestPhone || "Unknown"}
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>Address:</strong>{" "}
                                            {order.guestAddress || "Unknown"}
                                        </p>
                                    </>
                                )}
                            </section>

                            <section>
                                <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                                    Items
                                </h2>

                                <div style={{ display: "grid", gap: 12 }}>
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                border: "1px solid #eee",
                                                borderRadius: 8,
                                                padding: 12,
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: "0 0 8px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {item.nameSnapshot} x {item.quantity}
                                            </p>

                                            {item.options.length > 0 && (
                                                <ul
                                                    style={{
                                                        margin: "0 0 8px",
                                                        paddingLeft: 20,
                                                        color: "#666",
                                                    }}
                                                >
                                                    {item.options.map((option) => (
                                                        <li key={option.id}>
                                                            {
                                                                option.optionGroupNameSnapshot
                                                            }
                                                            :{" "}
                                                            {option.subItemNameSnapshot} -{" "}
                                                            {formatPrice(
                                                                option.priceCentsSnapshot
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <p style={{ margin: 0 }}>
                                                Line total:{" "}
                                                {formatPrice(item.totalCentsSnapshot)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
