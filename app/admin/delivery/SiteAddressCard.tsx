"use client";

import { useState } from "react";
import { useLanguage } from "../../LanguageProvider";
import { DeleteSiteAddressButton } from "./DeleteSiteAddressButton";
import { deleteSiteAddress, updateSiteAddress } from "./actions";

type SiteAddressCardProps = {
    siteAddress: {
        id: number;
        name: string;
        fullAddress: string;
        sortOrder: number;
        isActive: boolean;
    };
};

export function SiteAddressCard({ siteAddress }: SiteAddressCardProps) {
    const { t } = useLanguage();
    const [editing, setEditing] = useState(false);

    return (
        <article
            style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 16,
                background: "#fff",
            }}
        >
            {editing ? (
                <>
                    <form action={updateSiteAddress}>
                        <input
                            type="hidden"
                            name="siteAddressId"
                            value={siteAddress.id}
                        />

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor={`name-${siteAddress.id}`}>
                                {t("siteAddressName")}
                            </label>
                            <input
                                id={`name-${siteAddress.id}`}
                                name="name"
                                defaultValue={siteAddress.name}
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor={`address-${siteAddress.id}`}>
                                {t("fullAddress")}
                            </label>
                            <textarea
                                id={`address-${siteAddress.id}`}
                                name="fullAddress"
                                defaultValue={siteAddress.fullAddress}
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
                            <label htmlFor={`sortOrder-${siteAddress.id}`}>
                                {t("sortOrder")}
                            </label>
                            <input
                                id={`sortOrder-${siteAddress.id}`}
                                name="sortOrder"
                                type="number"
                                defaultValue={siteAddress.sortOrder}
                                required
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </div>

                        <label>
                            <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={siteAddress.isActive}
                            />{" "}
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
                            <button type="submit">{t("save")}</button>
                            <button type="button" onClick={() => setEditing(false)}>
                                {t("cancel")}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <>
                    <h3 style={{ margin: "0 0 8px" }}>{siteAddress.name}</h3>
                    <p style={{ margin: "0 0 8px" }}>{siteAddress.fullAddress}</p>
                    <p style={{ color: "#666", margin: "0 0 12px" }}>
                        {siteAddress.isActive ? t("active") : t("inactive")} /{" "}
                        {t("sortOrder")}: {siteAddress.sortOrder}
                    </p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setEditing(true)}>
                            {t("edit")}
                        </button>

                        <form action={deleteSiteAddress}>
                            <input
                                type="hidden"
                                name="siteAddressId"
                                value={siteAddress.id}
                            />
                            <DeleteSiteAddressButton
                                siteAddressName={siteAddress.name}
                            />
                        </form>
                    </div>
                </>
            )}
        </article>
    );
}
