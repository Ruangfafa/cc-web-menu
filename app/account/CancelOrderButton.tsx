"use client";

import { useLanguage } from "../LanguageProvider";

export function CancelOrderButton() {
    const { t } = useLanguage();

    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(t("cancelOrderConfirm"));

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
            style={{
                borderColor: "#b00020",
                color: "#b00020",
            }}
        >
            {t("cancelOrder")}
        </button>
    );
}
