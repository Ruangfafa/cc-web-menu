"use client";

import { readCart, subscribeCart } from "@/lib/cart";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

type CheckoutUserAddress = {
    id: number;
    fullAddress: string;
    isDefault: boolean;
};

type CheckoutClientProps = {
    isLoggedIn: boolean;
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
    isLoggedIn,
    userProfile,
}: CheckoutClientProps) {
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
    const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
        const defaultAddress = userProfile?.addresses.find(
            (address) => address.isDefault
        );

        return defaultAddress ? String(defaultAddress.id) : "";
    });

    const hasCartItems = cartItems.length > 0;

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
                    {isLoggedIn ? "Account Information" : "Guest Information"}
                </h2>

                {isLoggedIn && userProfile ? (
                    <>
                        <p style={{ margin: "0 0 8px" }}>
                            <strong>Name:</strong> {userProfile.name}
                        </p>

                        <p style={{ margin: "0 0 8px" }}>
                            <strong>Email:</strong> {userProfile.email}
                        </p>

                        <p style={{ margin: "0 0 16px" }}>
                            <strong>Phone:</strong> {userProfile.phone}
                        </p>

                        <section>
                            <h3>Select Delivery Address</h3>

                            {userProfile.addresses.length === 0 ? (
                                <div>
                                    <p style={{ color: "#666" }}>
                                        No saved address found for this account.
                                    </p>
                                    <p style={{ color: "#666" }}>
                                        Address management will be added later.
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
                                                    ? " (Default)"
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
                            <label htmlFor="guestName">Name</label>
                            <input
                                id="guestName"
                                value={guestName}
                                onChange={(event) =>
                                    setGuestName(event.target.value)
                                }
                                placeholder="Guest full name"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="guestPhone">Phone</label>
                            <input
                                id="guestPhone"
                                value={guestPhone}
                                onChange={(event) =>
                                    setGuestPhone(event.target.value)
                                }
                                placeholder="Guest phone number"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="guestAddress">Address</label>
                            <textarea
                                id="guestAddress"
                                value={guestAddress}
                                onChange={(event) =>
                                    setGuestAddress(event.target.value)
                                }
                                placeholder="Delivery address"
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
                    </form>
                )}

                <section
                    style={{
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: "1px solid #eee",
                    }}
                >
                    <h3>Next Step</h3>

                    <p style={{ color: "#666" }}>
                        This page only prepares checkout information for now.
                    </p>

                    <button
                        type="button"
                        disabled
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            background: "#eee",
                            color: "#666",
                            cursor: "not-allowed",
                        }}
                    >
                        Place Order Coming Soon
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
                <h2 style={{ marginTop: 0 }}>Order Summary</h2>

                {!hasCartItems ? (
                    <>
                        <p style={{ color: "#666" }}>
                            Your cart is empty. Please add items before checkout.
                        </p>

                        <p style={{ marginBottom: 0 }}>
                            <Link href="/menu">Back to menu</Link>
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
                                        Line total:{" "}
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
                                Subtotal: {formatPrice(subtotalCents)}
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link href="/cart">Edit cart</Link>
                                <Link href="/menu">Continue shopping</Link>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
