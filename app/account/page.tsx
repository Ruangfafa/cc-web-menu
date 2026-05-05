import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatMenuDate, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher";
import {
    cancelOrder,
    createAddress,
    deleteAddress,
    setDefaultAddress,
    signOutAccount,
    updateAccountProfile,
    updateAddress,
    updateOrderPickupTime,
} from "./actions";
import { CancelOrderButton } from "./CancelOrderButton";
import { DeleteAddressButton } from "./DeleteAddressButton";

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

function formatStatus(status: string) {
    return status
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

const pickupHourOptions = Array.from({ length: 24 }, (_, hour) =>
    String(hour).padStart(2, "0")
);
const pickupMinuteOptions = Array.from({ length: 60 }, (_, minute) =>
    String(minute).padStart(2, "0")
);

function canCustomerEditOrder(fulfillmentStatus: string) {
    return !["COMPLETED", "CANCELLED", "REFUNDED"].includes(
        fulfillmentStatus
    );
}

export default async function AccountPage({
    searchParams,
}: {
    searchParams: Promise<{ orderAction?: string }>;
}) {
    const { orderAction } = await searchParams;
    const t = createTranslator(await getLocale());
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
        include: {
            addresses: {
                orderBy: [
                    {
                        isDefault: "desc",
                    },
                    {
                        id: "asc",
                    },
                ],
            },
            orders: {
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: 10,
                include: {
                    items: true,
                },
            },
        },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>
                        {t("helloUser", {
                            name: session.user.name || t("user"),
                        })}
                    </strong>
                </p>

                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <Link className="menu-action-button" href="/menu">
                        {t("backToMenu")}
                    </Link>
                    <Link className="menu-action-button" href="/cart">
                        {t("cart")}
                    </Link>
                    <form action={signOutAccount}>
                        <button className="menu-action-button" type="submit">
                            {t("signOut")}
                        </button>
                    </form>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1 style={{ margin: "0 0 8px" }}>{t("account")}</h1>
                        <p style={{ color: "#666", margin: 0 }}>
                            {t("accountIntro")}
                        </p>
                    </div>
                </div>
            </header>

            {orderAction === "cancelled" && (
                <p
                    style={{
                        border: "1px solid #b8d7b8",
                        borderRadius: 8,
                        padding: 12,
                        background: "#f0fff0",
                        color: "#1f6b1f",
                    }}
                >
                    {t("orderCancelled")}
                </p>
            )}

            {orderAction === "pickup-updated" && (
                <p
                    style={{
                        border: "1px solid #b8d7b8",
                        borderRadius: 8,
                        padding: 12,
                        background: "#f0fff0",
                        color: "#1f6b1f",
                    }}
                >
                    {t("pickupTimeUpdated")}
                </p>
            )}

            {orderAction === "unavailable" && (
                <p
                    style={{
                        border: "1px solid #f0c36d",
                        borderRadius: 8,
                        padding: 12,
                        background: "#fff8e5",
                        color: "#7a4b00",
                    }}
                >
                    {t("orderUnavailable")}
                </p>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.8fr)",
                    gap: 24,
                    alignItems: "start",
                }}
            >
                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: 20,
                        background: "#fff",
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>{t("profile")}</h2>

                    <form action={updateAccountProfile}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="email">{t("email")}</label>
                            <input
                                id="email"
                                type="email"
                                value={user.email}
                                readOnly
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                    background: "#f5f5f5",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="name">{t("name")}</label>
                            <input
                                id="name"
                                name="name"
                                defaultValue={user.name}
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
                            <label htmlFor="phone">{t("phone")}</label>
                            <input
                                id="phone"
                                name="phone"
                                defaultValue={user.phone}
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
                            <label htmlFor="phone2">{t("backupPhone")}</label>
                            <input
                                id="phone2"
                                name="phone2"
                                defaultValue={user.phone2 || ""}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <button type="submit">{t("saveProfile")}</button>
                    </form>
                </section>

                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: 20,
                        background: "#fff",
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>{t("addAddress")}</h2>

                    <form action={createAddress}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="fullAddress">{t("address")}</label>
                            <textarea
                                id="fullAddress"
                                name="fullAddress"
                                required
                                rows={4}
                                placeholder={t("streetCityPostalCode")}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        <label>
                            <input
                                type="checkbox"
                                name="isDefault"
                                defaultChecked={user.addresses.length === 0}
                            />{" "}
                            {t("setAsDefault")}
                        </label>

                        <div style={{ marginTop: 16 }}>
                            <button type="submit">{t("addAddress")}</button>
                        </div>
                    </form>
                </section>
            </div>

            <section style={{ marginTop: 24 }}>
                <h2>{t("savedAddresses")}</h2>

                {user.addresses.length === 0 ? (
                    <p style={{ color: "#666" }}>
                        {t("noSavedAddresses")}
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {user.addresses.map((address) => (
                            <article
                                key={address.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 16,
                                    background: "#fff",
                                }}
                            >
                                <form action={updateAddress}>
                                    <input
                                        type="hidden"
                                        name="addressId"
                                        value={address.id}
                                    />

                                    <label htmlFor={`address-${address.id}`}>
                                        {t("address")}
                                    </label>
                                    <textarea
                                        id={`address-${address.id}`}
                                        name="fullAddress"
                                        defaultValue={address.fullAddress}
                                        required
                                        rows={3}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: 8,
                                            marginTop: 4,
                                            resize: "vertical",
                                        }}
                                    />

                                    {address.isDefault && (
                                        <p style={{ color: "#666" }}>
                                            {t("defaultAddress")}
                                        </p>
                                    )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            marginTop: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button type="submit">{t("saveAddress")}</button>
                                    </div>
                                </form>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {!address.isDefault && (
                                        <form action={setDefaultAddress}>
                                            <input
                                                type="hidden"
                                                name="addressId"
                                                value={address.id}
                                            />
                                            <button type="submit">
                                                {t("makeDefault")}
                                            </button>
                                        </form>
                                    )}

                                    <form action={deleteAddress}>
                                        <input
                                            type="hidden"
                                            name="addressId"
                                            value={address.id}
                                        />
                                        <DeleteAddressButton />
                                    </form>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: 24 }}>
                <h2>{t("recentOrders")}</h2>

                {user.orders.length === 0 ? (
                    <p style={{ color: "#666" }}>{t("noOrdersYet")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {user.orders.map((order) => {
                            const canEditOrder = canCustomerEditOrder(
                                order.fulfillmentStatus
                            );
                            const defaultPickupHour = order.pickupTime
                                ? String(order.pickupTime.getHours()).padStart(
                                      2,
                                      "0"
                                  )
                                : "";
                            const defaultPickupMinute = order.pickupTime
                                ? String(
                                      order.pickupTime.getMinutes()
                                  ).padStart(2, "0")
                                : "";

                            return (
                                <article
                                    key={order.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 8,
                                        padding: 16,
                                        background: "#fff",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div>
                                            <h3 style={{ margin: "0 0 8px" }}>
                                                {t("orderNumber", { id: order.id })}
                                            </h3>
                                            <p
                                                style={{
                                                    margin: "0 0 6px",
                                                    color: "#666",
                                                }}
                                            >
                                                {order.createdAt.toLocaleString()}
                                            </p>
                                            {order.pickupTime && (
                                                <p
                                                    style={{
                                                        margin: "0 0 6px",
                                                        color: "#666",
                                                    }}
                                                >
                                                    {t("pickup")}{" "}
                                                    {order.pickupTime.toLocaleString()}
                                                </p>
                                            )}
                                            {order.serviceDate && (
                                                <p
                                                    style={{
                                                        margin: "0 0 6px",
                                                        color: "#666",
                                                    }}
                                                >
                                                    {t("menuDate")}:{" "}
                                                    {formatMenuDate(
                                                        toDateKey(
                                                            order.serviceDate
                                                        )
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p style={{ margin: "0 0 6px" }}>
                                                {formatPrice(order.totalCents)}
                                            </p>
                                            <p style={{ margin: 0, color: "#666" }}>
                                                {formatStatus(order.paymentStatus)} /{" "}
                                                {formatStatus(
                                                    order.fulfillmentStatus
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <p style={{ color: "#666" }}>
                                        {t(
                                            order.items.length === 1
                                                ? "itemCount"
                                                : "itemCountPlural",
                                            { count: order.items.length }
                                        )}
                                    </p>

                                    {canEditOrder && (
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: 12,
                                                marginTop: 12,
                                                paddingTop: 12,
                                                borderTop: "1px solid #eee",
                                            }}
                                        >
                                            <form action={updateOrderPickupTime}>
                                                <input
                                                    type="hidden"
                                                    name="orderId"
                                                    value={order.id}
                                                />

                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(auto-fit, minmax(120px, 1fr))",
                                                        gap: 12,
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    <label
                                                        htmlFor={`pickup-hour-${order.id}`}
                                                    >
                                                        {t("hour")}
                                                        <select
                                                            id={`pickup-hour-${order.id}`}
                                                            name="pickupHour"
                                                            defaultValue={
                                                                defaultPickupHour
                                                            }
                                                            required
                                                            style={{
                                                                display: "block",
                                                                width: "100%",
                                                                padding: 8,
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            <option value="">
                                                                {t("hour")}
                                                            </option>
                                                            {pickupHourOptions.map(
                                                                (hour) => (
                                                                    <option
                                                                        key={hour}
                                                                        value={hour}
                                                                    >
                                                                        {hour}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </label>

                                                    <label
                                                        htmlFor={`pickup-minute-${order.id}`}
                                                    >
                                                        {t("minute")}
                                                        <select
                                                            id={`pickup-minute-${order.id}`}
                                                            name="pickupMinute"
                                                            defaultValue={
                                                                defaultPickupMinute
                                                            }
                                                            required
                                                            style={{
                                                                display: "block",
                                                                width: "100%",
                                                                padding: 8,
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            <option value="">
                                                                {t("minute")}
                                                            </option>
                                                            {pickupMinuteOptions.map(
                                                                (minute) => (
                                                                    <option
                                                                        key={
                                                                            minute
                                                                        }
                                                                        value={
                                                                            minute
                                                                        }
                                                                    >
                                                                        {minute}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </label>
                                                </div>

                                                <button type="submit">
                                                    {t("savePickupTime")}
                                                </button>
                                            </form>

                                            <form action={cancelOrder}>
                                                <input
                                                    type="hidden"
                                                    name="orderId"
                                                    value={order.id}
                                                />
                                                <CancelOrderButton />
                                            </form>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
