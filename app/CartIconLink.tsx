"use client";

import Link from "next/link";

type CartIconLinkProps = {
    ariaLabel: string;
    className?: string;
};

export function CartIconLink({
    ariaLabel,
    className = "menu-action-button",
}: CartIconLinkProps) {
    return (
        <Link
            aria-label={ariaLabel}
            className={`${className} cart-icon-link`}
            href="/cart"
            title={ariaLabel}
        >
            <svg
                aria-hidden="true"
                className="cart-icon"
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
        </Link>
    );
}
