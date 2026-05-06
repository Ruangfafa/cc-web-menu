import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatMenuDate, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { OrderFulfillmentStatus, OrderPaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ConfirmDeleteButton } from "../ConfirmDeleteButton";
import { deleteOrder, saveOrderComment } from "./actions";
import {
    buildOrderFilters,
    fulfillmentStatusOptions,
    paymentStatusOptions,
} from "./filters";
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
    searchParams: Promise<{
        conflict?: string;
        dateFrom?: string;
        dateTo?: string;
        paymentStatus?: string | string[];
        fulfillmentStatus?: string | string[];
    }>;
}) {
    const t = createTranslator(await getLocale());
    const { conflict, dateFrom, dateTo, paymentStatus, fulfillmentStatus } =
        await searchParams;
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }

    const {
        where: orderWhere,
        selectedPaymentStatuses,
        selectedFulfillmentStatuses,
    } = buildOrderFilters({
        dateFrom,
        dateTo,
        paymentStatus,
        fulfillmentStatus,
    });
    const exportSearchParams = new URLSearchParams();

    if (dateFrom) {
        exportSearchParams.set("dateFrom", dateFrom);
    }

    if (dateTo) {
        exportSearchParams.set("dateTo", dateTo);
    }

    for (const status of selectedPaymentStatuses) {
        exportSearchParams.append("paymentStatus", status);
    }

    for (const status of selectedFulfillmentStatuses) {
        exportSearchParams.append("fulfillmentStatus", status);
    }

    const orders = await prisma.order.findMany({
        where: orderWhere,
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

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 16,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("orderFilters")}</h2>

                <form action="/admin/orders" method="get">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 16,
                            marginBottom: 16,
                        }}
                    >
                        <label htmlFor="dateFrom">
                            {t("dateFrom")}
                            <input
                                id="dateFrom"
                                name="dateFrom"
                                type="date"
                                defaultValue={dateFrom || ""}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </label>

                        <label htmlFor="dateTo">
                            {t("dateTo")}
                            <input
                                id="dateTo"
                                name="dateTo"
                                type="date"
                                defaultValue={dateTo || ""}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </label>

                        <fieldset
                            style={{
                                border: "1px solid #eee",
                                borderRadius: 8,
                                margin: 0,
                                padding: 12,
                            }}
                        >
                            <legend>{t("paymentStatus")}</legend>
                            <div style={{ display: "grid", gap: 8 }}>
                                {paymentStatusOptions.map((status) => (
                                    <label key={status}>
                                        <input
                                            type="checkbox"
                                            name="paymentStatus"
                                            value={status}
                                            defaultChecked={selectedPaymentStatuses.includes(
                                                status
                                            )}
                                        />{" "}
                                        {status === OrderPaymentStatus.PAID
                                            ? t("paid")
                                            : t("pendingPayment")}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset
                            style={{
                                border: "1px solid #eee",
                                borderRadius: 8,
                                margin: 0,
                                padding: 12,
                            }}
                        >
                            <legend>{t("orderStatus")}</legend>
                            <div style={{ display: "grid", gap: 8 }}>
                                {fulfillmentStatusOptions.map((status) => {
                                    const label =
                                        status === OrderFulfillmentStatus.PREPARING
                                            ? t("preparing")
                                            : status ===
                                                OrderFulfillmentStatus.COMPLETED
                                              ? t("completed")
                                              : status ===
                                                  OrderFulfillmentStatus.CANCELLED
                                                ? t("cancelled")
                                                : t("refunded");

                                    return (
                                        <label key={status}>
                                            <input
                                                type="checkbox"
                                                name="fulfillmentStatus"
                                                value={status}
                                                defaultChecked={selectedFulfillmentStatuses.includes(
                                                    status
                                                )}
                                            />{" "}
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="submit">{t("applyFilters")}</button>
                        <a className="menu-action-button" href="/admin/orders">
                            {t("clearFilters")}
                        </a>
                        <a
                            className="menu-action-button"
                            href={`/admin/orders/export${
                                exportSearchParams.toString()
                                    ? `?${exportSearchParams.toString()}`
                                    : ""
                            }`}
                        >
                            {t("exportExcel")}
                        </a>
                    </div>
                </form>
            </section>

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
                                    className="mobile-shrink"
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
