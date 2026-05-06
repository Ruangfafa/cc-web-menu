"use client";

import { useState } from "react";
import { useLanguage } from "../../LanguageProvider";
import { createSiteAddress } from "./actions";

export function CreateSiteAddressCard() {
    const { t } = useLanguage();
    const [editing, setEditing] = useState(false);

    if (!editing) {
        return (
            <button type="button" onClick={() => setEditing(true)}>
                {t("createSiteAddress")}
            </button>
        );
    }

    return (
        <form action={createSiteAddress}>
            <div style={{ marginBottom: 16 }}>
                <label htmlFor="name">{t("siteAddressName")}</label>
                <input
                    id="name"
                    name="name"
                    required
                    style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                    }}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label htmlFor="fullAddress">{t("fullAddress")}</label>
                <textarea
                    id="fullAddress"
                    name="fullAddress"
                    required
                    rows={3}
                    style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        resize: "vertical",
                    }}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label htmlFor="sortOrder">{t("sortOrder")}</label>
                <input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    defaultValue={0}
                    required
                    style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                    }}
                />
            </div>

            <label>
                <input type="checkbox" name="isActive" defaultChecked />{" "}
                {t("active")}
            </label>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    flexWrap: "wrap",
                }}
            >
                <button type="submit">{t("createSiteAddress")}</button>
                <button type="button" onClick={() => setEditing(false)}>
                    {t("cancel")}
                </button>
            </div>
        </form>
    );
}
