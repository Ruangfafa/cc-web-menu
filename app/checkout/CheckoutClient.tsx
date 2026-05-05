"use client";

import { clearCart, readCart, subscribeCart } from "@/lib/cart";
import {
    buildLocalDateTimeFromDateKey,
    formatMenuDate,
} from "@/lib/menu-date";
import { DeliveryAddressMode } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useLanguage } from "../LanguageProvider";

type CheckoutUserAddress = {
    id: number;
    fullAddress: string;
    isDefault: boolean;
};

type CheckoutClientProps = {
    deliveryMode: DeliveryAddressMode;
    requirePickupTime: boolean;
    isLoggedIn: boolean;
    siteAddresses: Array<{
        id: number;
        name: string;
        fullAddress: string;
    }>;
    userProfile: {
        name: string;
        email: string;
        phone: string;
        addresses: CheckoutUserAddress[];
    } | null;
};

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

const pickupHourOptions = Array.from({ length: 24 }, (_, hour) =>
    String(hour).padStart(2, "0")
);
const pickupMinuteOptions = Array.from({ length: 60 }, (_, minute) =>
    String(minute).padStart(2, "0")
);

/**
 * 结账页客户端组件
 *
 * 功能：
 * 1. 从 localStorage 读取购物车快照
 * 2. 显示当前购物车摘要
 * 3. 已登录用户显示资料和地址选择
 * 4. 未登录访客显示姓名/电话/地址表单
 *
 * 为什么用 Client Component：
 * 购物车还在浏览器 localStorage，
 * 这部分必须在客户端读取。
 */
export default function CheckoutClient({
    deliveryMode,
    requirePickupTime,
    isLoggedIn,
    siteAddresses,
    userProfile,
}: CheckoutClientProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const cartItems = useSyncExternalStore(subscribeCart, readCart, () => []);

    const subtotalCents = useMemo(() => {
        return cartItems.reduce(
            (sum, item) => sum + item.totalPriceCentsSnapshot * item.quantity,
            0
        );
    }, [cartItems]);

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestAddress, setGuestAddress] = useState("");
    const [pickupHour, setPickupHour] = useState("");
    const [pickupMinute, setPickupMinute] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
        const defaultAddress = userProfile?.addresses.find(
            (address) => address.isDefault
        );

        return defaultAddress ? String(defaultAddress.id) : "";
    });

    const hasCartItems = cartItems.length > 0;
    const cartServiceDates = [
        ...new Set(cartItems.map((item) => item.serviceDate).filter(Boolean)),
    ];
    const cartServiceDate =
        cartServiceDates.length === 1 ? cartServiceDates[0] || "" : "";
    const cartHasSingleServiceDate =
        cartServiceDates.length === 1 &&
        cartItems.every((item) => item.serviceDate === cartServiceDates[0]);
    const useSiteAddressMode = deliveryMode === DeliveryAddressMode.SITE_ADDRESS;
    const hasSavedAddress = Boolean(userProfile?.addresses.length);
    const hasSiteAddress = siteAddresses.length > 0;
    const hasPickupTime =
        !requirePickupTime ||
        (Boolean(cartServiceDate) && Boolean(pickupHour) && Boolean(pickupMinute));

    const canSubmitOrder = isLoggedIn
        ? hasCartItems &&
          cartHasSingleServiceDate &&
          hasPickupTime &&
          (useSiteAddressMode
              ? hasSiteAddress && Boolean(selectedAddressId)
              : hasSavedAddress && Boolean(selectedAddressId))
        : hasCartItems &&
          cartHasSingleServiceDate &&
          hasPickupTime &&
          guestName.trim().length > 0 &&
          guestPhone.trim().length > 0 &&
          (useSiteAddressMode
              ? hasSiteAddress && Boolean(selectedAddressId)
              : guestAddress.trim().length > 0);

    async function handleSubmitOrder() {
        setSubmitError("");
        setSubmitting(true);

        const pickupTime =
            pickupHour && pickupMinute
                ? buildLocalDateTimeFromDateKey(
                      cartServiceDate,
                      pickupHour,
                      pickupMinute
                  )?.toISOString() || null
                : null;

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartItems,
                selectedAddressId: selectedAddressId
                    ? Number(selectedAddressId)
                    : null,
                deliveryMode,
                guestName,
                guestPhone,
                guestAddress,
                pickupTime,
            }),
        });

        const result = (await response.json()) as {
            success?: boolean;
            orderId?: number;
            error?: string;
        };

        setSubmitting(false);

        if (!response.ok || !result.success || !result.orderId) {
            setSubmitError(result.error || t("failedToCreateOrder"));
            return;
        }

        clearCart();
        router.push(`/checkout/success?orderId=${result.orderId}`);
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
                gap: 24,
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
                <h2 style={{ marginTop: 0 }}>
                    {isLoggedIn ? t("accountInformation") : t("guestInformation")}
                </h2>

                {isLoggedIn && userProfile ? (
                    <>
                        <p style={{ margin: "0 0 8px" }}>
                            <strong>{t("name")}:</strong> {userProfile.name}
                        </p>

                        <p style={{ margin: "0 0 8px" }}>
                            <strong>{t("email")}:</strong> {userProfile.email}
                        </p>

                        <p style={{ margin: "0 0 16px" }}>
                            <strong>{t("phone")}:</strong> {userProfile.phone}
                        </p>

                        <section>
                            <h3>
                                {useSiteAddressMode
                                    ? t("selectSiteAddress")
                                    : t("selectDeliveryAddress")}
                            </h3>

                            {useSiteAddressMode ? (
                                siteAddresses.length === 0 ? (
                                    <div>
                                        <p style={{ color: "#666" }}>
                                            {t("noSiteAddress")}
                                        </p>
                                        <p style={{ color: "#666" }}>
                                            {t("askAdminSiteAddresses")}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gap: 12 }}>
                                        {siteAddresses.map((address) => (
                                            <label
                                                key={address.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: 10,
                                                    padding: 12,
                                                    border: "1px solid #eee",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="site-address"
                                                    value={address.id}
                                                    checked={
                                                        selectedAddressId ===
                                                        String(address.id)
                                                    }
                                                    onChange={(event) =>
                                                        setSelectedAddressId(
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                                <span>
                                                    <strong>{address.name}</strong>
                                                    <br />
                                                    {address.fullAddress}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )
                            ) : userProfile.addresses.length === 0 ? (
                                <div>
                                    <p style={{ color: "#666" }}>
                                        {t("noSavedAddressForAccount")}
                                    </p>
                                    <p style={{ color: "#666" }}>
                                        {t("addAddressBeforeOrder")}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: 12 }}>
                                    {userProfile.addresses.map((address) => (
                                        <label
                                            key={address.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                padding: 12,
                                                border: "1px solid #eee",
                                                borderRadius: 8,
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="saved-address"
                                                value={address.id}
                                                checked={
                                                    selectedAddressId ===
                                                    String(address.id)
                                                }
                                                onChange={(event) =>
                                                    setSelectedAddressId(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <span>
                                                {address.fullAddress}
                                                {address.isDefault
                                                    ? ` (${t("default")})`
                                                    : ""}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <form>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="guestName">{t("name")}</label>
                            <input
                                id="guestName"
                                value={guestName}
                                onChange={(event) =>
                                    setGuestName(event.target.value)
                                }
                                placeholder={t("guestFullName")}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="guestPhone">{t("phone")}</label>
                            <input
                                id="guestPhone"
                                value={guestPhone}
                                onChange={(event) =>
                                    setGuestPhone(event.target.value)
                                }
                                placeholder={t("guestPhoneNumber")}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        {useSiteAddressMode ? (
                            <div style={{ marginBottom: 16 }}>
                                <label>{t("selectSiteAddress")}</label>

                                {siteAddresses.length === 0 ? (
                                    <p style={{ color: "#666", marginTop: 4 }}>
                                        {t("noSiteAddress")}
                                    </p>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gap: 12,
                                            marginTop: 8,
                                        }}
                                    >
                                        {siteAddresses.map((address) => (
                                            <label
                                                key={address.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: 10,
                                                    padding: 12,
                                                    border: "1px solid #eee",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="guest-site-address"
                                                    value={address.id}
                                                    checked={
                                                        selectedAddressId ===
                                                        String(address.id)
                                                    }
                                                    onChange={(event) =>
                                                        setSelectedAddressId(
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                                <span>
                                                    <strong>{address.name}</strong>
                                                    <br />
                                                    {address.fullAddress}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginBottom: 16 }}>
                                <label htmlFor="guestAddress">{t("address")}</label>
                                <textarea
                                    id="guestAddress"
                                    value={guestAddress}
                                    onChange={(event) =>
                                        setGuestAddress(event.target.value)
                                    }
                                    placeholder={t("deliveryAddress")}
                                    rows={4}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: 8,
                                        marginTop: 4,
                                        resize: "vertical",
                                    }}
                                />
                            </div>
                        )}
                    </form>
                )}

                {requirePickupTime && (
                    <section
                        style={{
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: "1px solid #eee",
                        }}
                    >
                        <h3>{t("pickupTime")}</h3>

                        {cartServiceDate && (
                            <p style={{ color: "#666" }}>
                                {t("pickupDate")} {formatMenuDate(cartServiceDate)}
                            </p>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(120px, 1fr))",
                                gap: 12,
                            }}
                        >
                            <label htmlFor="pickupHour">
                                {t("hour")}
                                <select
                                    id="pickupHour"
                                    value={pickupHour}
                                    onChange={(event) =>
                                        setPickupHour(event.target.value)
                                    }
                                    required
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: 8,
                                        marginTop: 4,
                                    }}
                                >
                                    <option value="">{t("hour")}</option>
                                    {pickupHourOptions.map((hour) => (
                                        <option key={hour} value={hour}>
                                            {hour}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label htmlFor="pickupMinute">
                                {t("minute")}
                                <select
                                    id="pickupMinute"
                                    value={pickupMinute}
                                    onChange={(event) =>
                                        setPickupMinute(event.target.value)
                                    }
                                    required
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: 8,
                                        marginTop: 4,
                                    }}
                                >
                                    <option value="">{t("minute")}</option>
                                    {pickupMinuteOptions.map((minute) => (
                                        <option key={minute} value={minute}>
                                            {minute}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <p style={{ color: "#666" }}>
                            {t("pickupTimeRequired")}
                        </p>
                    </section>
                )}

                <section
                    style={{
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: "1px solid #eee",
                    }}
                >
                    <h3>{t("nextStep")}</h3>

                    <p style={{ color: "#666" }}>
                        {t("submitCartAsOrder")}
                    </p>

                    {submitError && (
                        <p style={{ color: "#b00020" }}>{submitError}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={!canSubmitOrder || submitting}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: "1px solid #333",
                            background:
                                !canSubmitOrder || submitting ? "#ddd" : "#111",
                            color:
                                !canSubmitOrder || submitting ? "#666" : "#fff",
                            cursor:
                                !canSubmitOrder || submitting
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {submitting ? t("submitting") : t("placeOrder")}
                    </button>
                </section>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fafafa",
                    alignSelf: "start",
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("orderSummary")}</h2>

                {hasCartItems && (
                    <p style={{ color: "#666", marginTop: 0 }}>
                        {t("menuDate")}:{" "}
                        {cartHasSingleServiceDate
                            ? formatMenuDate(cartServiceDate)
                            : t("mixedDatesNotAllowed")}
                    </p>
                )}

                {!hasCartItems ? (
                    <>
                        <p style={{ color: "#666" }}>
                            {t("cartEmptyCheckout")}
                        </p>

                        <p style={{ marginBottom: 0 }}>
                            <Link href="/menu">{t("backToMenu")}</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ display: "grid", gap: 12 }}>
                            {cartItems.map((item) => (
                                <article
                                    key={item.cartItemId}
                                    style={{
                                        border: "1px solid #e5e5e5",
                                        borderRadius: 8,
                                        padding: 12,
                                        background: "#fff",
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

                                    {item.selectedOptions.length > 0 && (
                                        <ul
                                            style={{
                                                margin: "0 0 8px",
                                                paddingLeft: 20,
                                                color: "#666",
                                            }}
                                        >
                                            {item.selectedOptions.map(
                                                (option) => (
                                                    <li
                                                        key={`${item.cartItemId}-${option.optionGroupItemId}`}
                                                    >
                                                        {
                                                            option.optionGroupNameSnapshot
                                                        }
                                                        :{" "}
                                                        {
                                                            option.subItemNameSnapshot
                                                        }
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    )}

                                    <p style={{ margin: 0 }}>
                                        {t("lineTotal")}{" "}
                                        {formatPrice(
                                            item.totalPriceCentsSnapshot *
                                                item.quantity
                                        )}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <div
                            style={{
                                marginTop: 20,
                                paddingTop: 16,
                                borderTop: "1px solid #ddd",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 12px",
                                    fontWeight: "bold",
                                    fontSize: 18,
                                }}
                            >
                                {t("subtotal")} {formatPrice(subtotalCents)}
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link href="/cart">{t("editCart")}</Link>
                                <Link href="/menu">{t("continueShoppingLower")}</Link>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
