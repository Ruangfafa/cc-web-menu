"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";
import { deleteAddress, setDefaultAddress, updateAddress } from "./actions";
import { DeleteAddressButton } from "./DeleteAddressButton";

type SavedAddressCardProps = {
    address: {
        id: number;
        fullAddress: string;
        isDefault: boolean;
    };
};

export function SavedAddressCard({ address }: SavedAddressCardProps) {
    const { t } = useLanguage();
    const [editing, setEditing] = useState(false);

    return (
        <article
            style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                background: "#fff",
            }}
        >
            {editing ? (
                <form action={updateAddress}>
                    <input type="hidden" name="addressId" value={address.id} />

                    <label htmlFor={`address-${address.id}`}>{t("address")}</label>
                    <AddressAutocompleteInput
                        id={`address-${address.id}`}
                        name="fullAddress"
                        defaultValue={address.fullAddress}
                        required
                        rows={3}
                    />

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <button type="submit">{t("saveAddress")}</button>
                        <button type="button" onClick={() => setEditing(false)}>
                            {t("cancel")}
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <p style={{ margin: "0 0 8px" }}>{address.fullAddress}</p>

                    {address.isDefault && (
                        <p style={{ color: "#666", margin: "0 0 12px" }}>
                            {t("defaultAddress")}
                        </p>
                    )}

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <button type="button" onClick={() => setEditing(true)}>
                            {t("edit")}
                        </button>

                        {!address.isDefault && (
                            <form action={setDefaultAddress}>
                                <input
                                    type="hidden"
                                    name="addressId"
                                    value={address.id}
                                />
                                <button type="submit">{t("makeDefault")}</button>
                            </form>
                        )}

                        <form action={deleteAddress}>
                            <input
                                type="hidden"
                                name="addressId"
                                value={address.id}
                            />
                            <DeleteAddressButton />
                        </form>
                    </div>
                </>
            )}
        </article>
    );
}
