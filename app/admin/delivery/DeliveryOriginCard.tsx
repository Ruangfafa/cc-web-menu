"use client";

import { useState } from "react";
import { AddressAutocompleteInput } from "../../account/AddressAutocompleteInput";
import { useLanguage } from "../../LanguageProvider";
import { updateDeliveryOrigin } from "./actions";

type DeliveryOriginCardProps = {
    originAddress: string;
};

export function DeliveryOriginCard({ originAddress }: DeliveryOriginCardProps) {
    const { t } = useLanguage();
    const [editing, setEditing] = useState(!originAddress);

    if (!editing) {
        return (
            <div>
                <p style={{ margin: "0 0 12px" }}>
                    {originAddress || t("notConfigured")}
                </p>
                <button type="button" onClick={() => setEditing(true)}>
                    {t("edit")}
                </button>
            </div>
        );
    }

    return (
        <form action={updateDeliveryOrigin}>
            <div style={{ marginBottom: 16 }}>
                <label htmlFor="deliveryOriginAddress">
                    {t("deliveryOriginAddress")}
                </label>
                <AddressAutocompleteInput
                    id="deliveryOriginAddress"
                    name="fullAddress"
                    defaultValue={originAddress}
                    required
                    rows={3}
                    placeholder={t("streetCityPostalCode")}
                />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit">{t("saveSettings")}</button>
                {originAddress && (
                    <button type="button" onClick={() => setEditing(false)}>
                        {t("cancel")}
                    </button>
                )}
            </div>
        </form>
    );
}
