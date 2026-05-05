"use client";

import { useLanguage } from "../LanguageProvider";

type ConfirmDeleteButtonProps = {
    itemName: string;
};

export function ConfirmDeleteButton({ itemName }: ConfirmDeleteButtonProps) {
    const { t } = useLanguage();

    return (
        <button
            className="menu-action-button menu-action-button-danger"
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(
                    t("deleteItemConfirm", { name: itemName })
                );

                if (!confirmed) {
                    event.preventDefault();
                }
            }}
        >
            {t("delete")}
        </button>
    );
}
