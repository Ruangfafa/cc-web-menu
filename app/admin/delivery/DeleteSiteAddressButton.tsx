"use client";

import { useLanguage } from "../../LanguageProvider";

type DeleteSiteAddressButtonProps = {
    siteAddressName: string;
};

export function DeleteSiteAddressButton({
    siteAddressName,
}: DeleteSiteAddressButtonProps) {
    const { t } = useLanguage();

    return (
        <button
            className="menu-action-button menu-action-button-danger"
            type="submit"
            onClick={(event) => {
                const confirmed = window.confirm(
                    t("deleteItemConfirm", { name: siteAddressName })
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
