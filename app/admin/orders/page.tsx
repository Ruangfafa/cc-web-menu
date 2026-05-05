import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatMenuDate, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { deleteOrder, saveOrderComment } from "./actions";
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
    const t = createTranslator(await getLocale());
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
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin">
                        {t("backToAdmin")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>{t("orderManagement")}</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    {t("ordersAdminDesc")}
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
                    {t("orderConflict")}
                </p>
            )}

            {orders.length === 0 ? (
                <p style={{ color: "#666" }}>{t("noOrdersYet")}</p>
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
                                        <strong>
                                            {t("orderNumber", { id: order.id })}
                                        </strong>
                                    </p>

                                    <p style={{ margin: "0 0 8px", color: "#666" }}>
                                        {t("orderCreatedLabel")}{" "}
                                        {order.createdAt.toLocaleString()}
                                    </p>

                                    {order.pickupTime && (
                                        <p
                                            style={{
                                                margin: "0 0 8px",
                                                color: "#666",
                                            }}
                                        >
                                            {t("pickupLabel")}{" "}
                                            {order.pickupTime.toLocaleString()}
                                        </p>
                                    )}

                                    {order.serviceDate && (
                                        <p
                                            style={{
                                                margin: "0 0 8px",
                                                color: "#666",
                                            }}
                                        >
                                            {t("menuDateLabel")}{" "}
                                            {formatMenuDate(
                                                toDateKey(order.serviceDate)
                                            )}
                                        </p>
                                    )}

                                    <p style={{ margin: 0 }}>
                                        {t("orderTotalLabel")}{" "}
                                        {formatPrice(order.totalCents)}
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
                                            {t("comment")}
                                            <textarea
                                                id={`comment-${order.id}`}
                                                name="comment"
                                                defaultValue={order.comment || ""}
                                                placeholder={t("addInternalNotes")}
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
                                            {t("save")}
                                        </button>
                                    </form>

                                    <form action={deleteOrder}>
                                        <input
                                            type="hidden"
                                            name="orderId"
                                            value={order.id}
                                        />
                                        <ConfirmDeleteButton
                                            itemName={t("orderNumber", {
                                                id: order.id,
                                            })}
                                        />
                                    </form>
                                </div>
                            </div>

                            <section style={{ marginBottom: 16 }}>
                                <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                                    {t("customer")}
                                </h2>

                                {order.user ? (
                                    <>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>{t("userLabel")}</strong>{" "}
                                            {order.user.name} (
                                            {order.user.email})
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>{t("phoneLabel")}</strong>{" "}
                                            {order.user.phone}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>{t("guest")}:</strong>{" "}
                                            {order.guestName || t("unknown")}
                                        </p>
                                        <p style={{ margin: "0 0 6px" }}>
                                            <strong>{t("phoneLabel")}</strong>{" "}
                                            {order.guestPhone || t("unknown")}
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>{t("addressLabel")}</strong>{" "}
                                            {order.guestAddress || t("unknown")}
                                        </p>
                                    </>
                                )}
                            </section>

                            <section>
                                <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                                    {t("items")}
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
                                                {t("lineTotal")}{" "}
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
