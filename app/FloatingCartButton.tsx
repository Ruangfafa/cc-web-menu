"use client";

import {
    getServerCartSnapshot,
    readCart,
    subscribeCart,
} from "@/lib/cart";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useLanguage } from "./LanguageProvider";

export function FloatingCartButton() {
    const { t } = useLanguage();
    const cartItems = useSyncExternalStore(
        subscribeCart,
        readCart,
        getServerCartSnapshot
    );
    const itemCount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cartItems]);

    if (itemCount === 0) {
        return null;
    }

    const displayCount = itemCount > 99 ? "99+" : String(itemCount);

    return (
        <Link
            aria-label={`${t("cart")} (${displayCount})`}
            className="floating-cart-button"
            href="/cart"
            title={`${t("cart")} (${displayCount})`}
        >
            <svg
                aria-hidden="true"
                className="floating-cart-icon"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 8H6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                />
                <circle cx="10" cy="20" fill="currentColor" r="1.5" />
                <circle cx="17" cy="20" fill="currentColor" r="1.5" />
            </svg>
            <span className="floating-cart-count">{displayCount}</span>
        </Link>
    );
}
