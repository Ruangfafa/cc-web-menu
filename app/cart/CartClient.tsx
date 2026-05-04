"use client";

import {
    clearCart,
    readCart,
    removeCartItem,
    subscribeCart,
    updateCartItemQuantity,
} from "@/lib/cart";
import { formatMenuDate } from "@/lib/menu-date";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * /cart 页面客户端组件
 *
 * 功能：
 * 1. 从 localStorage 读取购物车快照
 * 2. 显示每个菜品和已选 options
 * 3. 支持数量 + / -
 * 4. 支持删除单个条目和清空购物车
 * 5. 计算 subtotal
 *
 * 为什么用 Client Component：
 * 当前购物车数据还在浏览器 localStorage，
 * 服务端页面无法直接读取这份状态。
 */
export default function CartClient() {
    const cartItems = useSyncExternalStore(subscribeCart, readCart, () => []);

    const subtotalCents = useMemo(() => {
        return cartItems.reduce(
            (sum, item) => sum + item.totalPriceCentsSnapshot * item.quantity,
            0
        );
    }, [cartItems]);
    const cartServiceDates = [
        ...new Set(cartItems.map((item) => item.serviceDate).filter(Boolean)),
    ];
    const cartHasSingleServiceDate =
        cartServiceDates.length === 1 &&
        cartItems.every((item) => item.serviceDate === cartServiceDates[0]);
    const cartServiceDate = cartHasSingleServiceDate
        ? cartServiceDates[0] || ""
        : "";

    function handleDecrease(cartItemId: string, currentQuantity: number) {
        updateCartItemQuantity(cartItemId, currentQuantity - 1);
    }

    function handleIncrease(cartItemId: string, currentQuantity: number) {
        updateCartItemQuantity(cartItemId, currentQuantity + 1);
    }

    function handleRemove(cartItemId: string) {
        removeCartItem(cartItemId);
    }

    function handleClearCart() {
        clearCart();
    }

    if (cartItems.length === 0) {
        return (
            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                }}
            >
                <p style={{ marginTop: 0 }}>Your cart is empty.</p>
                <p style={{ marginBottom: 0 }}>
                    <Link href="/menu">Back to menu</Link>
                </p>
            </section>
        );
    }

    return (
        <section>
            <div style={{ display: "grid", gap: 16 }}>
                {cartItems.map((item) => (
                    <article
                        key={item.cartItemId}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 16,
                            background: "#fff",
                        }}
                    >
                        <h2 style={{ margin: "0 0 8px" }}>{item.nameSnapshot}</h2>

                        <p style={{ margin: "0 0 8px", color: "#666" }}>
                            Menu date:{" "}
                            {item.serviceDate
                                ? formatMenuDate(item.serviceDate)
                                : "Unknown"}
                        </p>

                        <p style={{ margin: "0 0 8px", color: "#666" }}>
                            Base price:{" "}
                            {formatPrice(item.basePriceCentsSnapshot)}
                        </p>

                        {item.selectedOptions.length === 0 ? (
                            <p style={{ margin: "0 0 12px", color: "#666" }}>
                                No extra options selected.
                            </p>
                        ) : (
                            <div style={{ marginBottom: 12 }}>
                                <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                                    Selected options
                                </p>

                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {item.selectedOptions.map((option) => (
                                        <li
                                            key={`${item.cartItemId}-${option.optionGroupItemId}`}
                                        >
                                            {option.optionGroupNameSnapshot}:{" "}
                                            {option.subItemNameSnapshot} -{" "}
                                            {formatPrice(
                                                option.priceCentsSnapshot
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p style={{ margin: "0 0 12px", fontWeight: "bold" }}>
                            Unit total:{" "}
                            {formatPrice(item.totalPriceCentsSnapshot)}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <span>Quantity:</span>

                            <button
                                type="button"
                                onClick={() =>
                                    handleDecrease(
                                        item.cartItemId,
                                        item.quantity
                                    )
                                }
                                disabled={item.quantity <= 1}
                            >
                                -
                            </button>

                            <strong>{item.quantity}</strong>

                            <button
                                type="button"
                                onClick={() =>
                                    handleIncrease(
                                        item.cartItemId,
                                        item.quantity
                                    )
                                }
                            >
                                +
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRemove(item.cartItemId)}
                                style={{ marginLeft: 8 }}
                            >
                                Remove
                            </button>
                        </div>

                        <p style={{ margin: 0 }}>
                            Line total:{" "}
                            {formatPrice(
                                item.totalPriceCentsSnapshot * item.quantity
                            )}
                        </p>
                    </article>
                ))}
            </div>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fafafa",
                    marginTop: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>Order Summary</h2>

                <p style={{ fontWeight: "bold", fontSize: 18 }}>
                    Subtotal: {formatPrice(subtotalCents)}
                </p>

                {!cartHasSingleServiceDate && (
                    <p style={{ color: "#b00020" }}>
                        This cart contains mixed or unknown menu dates. Remove
                        older items before checkout.
                    </p>
                )}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/menu">Continue Shopping</Link>
                    {cartHasSingleServiceDate ? (
                        <Link href="/checkout">Checkout</Link>
                    ) : (
                        <span style={{ color: "#666" }}>Checkout unavailable</span>
                    )}

                    <button type="button" onClick={handleClearCart}>
                        Clear Cart
                    </button>
                </div>
            </section>
        </section>
    );
}
