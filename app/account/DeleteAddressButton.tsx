"use client";

import { useLanguage } from "../LanguageProvider";

export function DeleteAddressButton() {
    const { t } = useLanguage();

    return (
        <button
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(t("deleteAddressConfirm"));

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
            style={{
                borderColor: "#b00020",
                color: "#b00020",
            }}
        >
            {t("delete")}
        </button>
    );
}
