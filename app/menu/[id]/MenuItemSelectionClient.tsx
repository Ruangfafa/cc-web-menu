"use client";

import { addCartItem, type CartItem } from "@/lib/cart";
import { useMemo, useState } from "react";
import { useLanguage } from "../../LanguageProvider";

type MenuItemSelectionData = {
    id: number;
    displayName: string | null;
    mainItem: {
        id: number;
        name: string;
        priceCents: number;
    };
    optionGroups: Array<{
        id: number;
        optionGroup: {
            id: number;
            name: string;
            description: string | null;
            isRequired: boolean;
            minSelect: number;
            maxSelect: number;
            options: Array<{
                id: number;
                priceCents: number;
                isDefault: boolean;
                subItem: {
                    id: number;
                    name: string;
                };
            }>;
        };
    }>;
};

type SelectedOptionsState = Record<number, number[]>;

type SelectedOptionDetail = {
    optionGroupId: number;
    optionGroupName: string;
    optionGroupItemId: number;
    subItemId: number;
    subItemName: string;
    priceCents: number;
};

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

function buildInitialSelections(
    menuItem: MenuItemSelectionData
): SelectedOptionsState {
    const selections: SelectedOptionsState = {};

    for (const relation of menuItem.optionGroups) {
        const group = relation.optionGroup;
        const defaultOptionIds = group.options
            .filter((option) => option.isDefault)
            .slice(0, Math.max(group.maxSelect, 0))
            .map((option) => option.id);

        selections[group.id] = defaultOptionIds;
    }

    return selections;
}

export default function MenuItemSelectionClient({
    menuItem,
    serviceDate,
}: {
    menuItem: MenuItemSelectionData;
    serviceDate: string;
}) {
    const { t } = useLanguage();
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsState>(
        () => buildInitialSelections(menuItem)
    );
    const [addToCartMessage, setAddToCartMessage] = useState("");

    const selectedOptionDetails = useMemo<SelectedOptionDetail[]>(() => {
        return menuItem.optionGroups.flatMap((relation) => {
            const group = relation.optionGroup;
            const selectedIds = selectedOptions[group.id] || [];

            return group.options
                .filter((option) => selectedIds.includes(option.id))
                .map((option) => ({
                    optionGroupId: group.id,
                    optionGroupName: group.name,
                    optionGroupItemId: option.id,
                    subItemId: option.subItem.id,
                    subItemName: option.subItem.name,
                    priceCents: option.priceCents,
                }));
        });
    }, [menuItem.optionGroups, selectedOptions, t]);

    const totalPriceCents = useMemo(() => {
        return (
            menuItem.mainItem.priceCents +
            selectedOptionDetails.reduce(
                (sum, option) => sum + option.priceCents,
                0
            )
        );
    }, [menuItem.mainItem.priceCents, selectedOptionDetails]);

    const validationErrors = useMemo(() => {
        return menuItem.optionGroups.flatMap((relation) => {
            const group = relation.optionGroup;
            const selectedCount = (selectedOptions[group.id] || []).length;

            if (selectedCount < group.minSelect) {
                return [
                    t("needsMoreSelections", {
                        name: group.name,
                        count: group.minSelect - selectedCount,
                    }),
                ];
            }

            if (selectedCount > group.maxSelect) {
                return [
                    t("allowsAtMost", {
                        name: group.name,
                        count: group.maxSelect,
                    }),
                ];
            }

            return [];
        });
    }, [menuItem.optionGroups, selectedOptions]);

    const isSelectionValid = validationErrors.length === 0;

    function handleSingleSelect(groupId: number, optionId: number) {
        setSelectedOptions((current) => ({
            ...current,
            [groupId]: [optionId],
        }));
        setAddToCartMessage("");
    }

    function handleMultiSelect(
        groupId: number,
        optionId: number,
        checked: boolean,
        maxSelect: number
    ) {
        setSelectedOptions((current) => {
            const existingIds = current[groupId] || [];

            if (checked) {
                if (existingIds.includes(optionId)) {
                    return current;
                }

                if (existingIds.length >= maxSelect) {
                    return current;
                }

                return {
                    ...current,
                    [groupId]: [...existingIds, optionId],
                };
            }

            return {
                ...current,
                [groupId]: existingIds.filter((id) => id !== optionId),
            };
        });
        setAddToCartMessage("");
    }

    function handleAddToCart() {
        if (!isSelectionValid) {
            setAddToCartMessage(t("fixValidationErrors"));
            return;
        }

        const nameSnapshot = menuItem.displayName || menuItem.mainItem.name;

        const cartItem: CartItem = {
            cartItemId: crypto.randomUUID(),
            serviceDate,
            menuItemId: menuItem.id,
            mainItemId: menuItem.mainItem.id,
            nameSnapshot,
            basePriceCentsSnapshot: menuItem.mainItem.priceCents,
            selectedOptions: selectedOptionDetails.map((option) => ({
                optionGroupId: option.optionGroupId,
                optionGroupNameSnapshot: option.optionGroupName,
                optionGroupItemId: option.optionGroupItemId,
                subItemId: option.subItemId,
                subItemNameSnapshot: option.subItemName,
                priceCentsSnapshot: option.priceCents,
            })),
            quantity: 1,
            totalPriceCentsSnapshot: totalPriceCents,
        };

        const result = addCartItem(cartItem);

        if (!result.success) {
            setAddToCartMessage(result.error);
            return;
        }

        setAddToCartMessage(t("addedToCartFor", { date: serviceDate }));
    }

    return (
        <section>
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 24,
                    background: "#fafafa",
                }}
            >
                <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                    {t("currentTotal")}: {formatPrice(totalPriceCents)}
                </p>

                <p style={{ margin: 0, color: "#666" }}>
                    {t("itemPriceSummary", {
                        date: serviceDate,
                        base: formatPrice(menuItem.mainItem.priceCents),
                        options: formatPrice(
                            totalPriceCents - menuItem.mainItem.priceCents
                        ),
                    })}
                </p>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
                {menuItem.optionGroups.map((relation) => {
                    const group = relation.optionGroup;
                    const selectedIds = selectedOptions[group.id] || [];
                    const isSingleSelect = group.maxSelect <= 1;
                    const selectedCount = selectedIds.length;
                    const isBelowMin = selectedCount < group.minSelect;
                    const isAboveMax = selectedCount > group.maxSelect;

                    return (
                        <article
                            key={relation.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 10,
                                padding: 16,
                                background: "#fff",
                            }}
                        >
                            <h2 style={{ margin: "0 0 8px" }}>{group.name}</h2>

                            <p style={{ margin: "0 0 8px", color: "#444" }}>
                                {t("groupRules", {
                                    type: group.isRequired
                                        ? t("required")
                                        : t("optional"),
                                    min: group.minSelect,
                                    max: group.maxSelect,
                                })}
                            </p>

                            {group.description && (
                                <p style={{ margin: "0 0 12px", color: "#666" }}>
                                    {group.description}
                                </p>
                            )}

                            <p style={{ margin: "0 0 12px", color: "#666" }}>
                                {t("selectedCount", { count: selectedCount })}
                                {isSingleSelect
                                    ? t("singleChoiceGroup")
                                    : t("multiChoiceGroup")}
                            </p>

                            {group.options.length === 0 ? (
                                <p style={{ color: "#999", margin: 0 }}>
                                    {t("noOptionsInGroup")}
                                </p>
                            ) : (
                                <div style={{ display: "grid", gap: 10 }}>
                                    {group.options.map((option) => {
                                        const isChecked = selectedIds.includes(
                                            option.id
                                        );
                                        const disableUnchecked =
                                            !isSingleSelect &&
                                            !isChecked &&
                                            selectedCount >= group.maxSelect;

                                        return (
                                            <label
                                                key={option.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: 10,
                                                    border: "1px solid #eee",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <input
                                                    type={
                                                        isSingleSelect
                                                            ? "radio"
                                                            : "checkbox"
                                                    }
                                                    name={`option-group-${group.id}`}
                                                    checked={isChecked}
                                                    disabled={disableUnchecked}
                                                    onChange={(event) => {
                                                        if (isSingleSelect) {
                                                            handleSingleSelect(
                                                                group.id,
                                                                option.id
                                                            );
                                                            return;
                                                        }

                                                        handleMultiSelect(
                                                            group.id,
                                                            option.id,
                                                            event.target
                                                                .checked,
                                                            group.maxSelect
                                                        );
                                                    }}
                                                />

                                                <span style={{ flex: 1 }}>
                                                    {option.subItem.name}
                                                    {option.isDefault
                                                        ? ` (${t("default")})`
                                                        : ""}
                                                </span>

                                                <strong>
                                                    {formatPrice(
                                                        option.priceCents
                                                    )}
                                                </strong>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {(isBelowMin || isAboveMax) && (
                                <p
                                    style={{
                                        margin: "12px 0 0",
                                        color: "#b00020",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {isBelowMin
                                        ? t("pleaseSelectAtLeast", {
                                              count: group.minSelect,
                                          })
                                        : t("pleaseSelectAtMost", {
                                              count: group.maxSelect,
                                          })}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 16,
                    marginTop: 24,
                    background: "#fff",
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("addToCart")}</h2>

                <p style={{ color: "#666" }}>
                    {t("addToCartHelp")}
                </p>

                {validationErrors.length > 0 && (
                    <ul style={{ color: "#b00020", paddingLeft: 20 }}>
                        {validationErrors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                )}

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isSelectionValid}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid #333",
                        background: isSelectionValid ? "#111" : "#ddd",
                        color: isSelectionValid ? "#fff" : "#666",
                        cursor: isSelectionValid ? "pointer" : "not-allowed",
                    }}
                >
                    {t("addToCart")}
                </button>

                {addToCartMessage && (
                    <p
                        style={{
                            margin: "12px 0 0",
                            color: isSelectionValid ? "#0a6b2d" : "#b00020",
                        }}
                    >
                        {addToCartMessage}
                    </p>
                )}
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 16,
                    marginTop: 24,
                    background: "#fafafa",
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("selectionSummary")}</h2>

                {selectedOptionDetails.length === 0 ? (
                    <p style={{ color: "#666", margin: 0 }}>
                        {t("noExtraOptionsSelectedYet")}
                    </p>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {selectedOptionDetails.map((option) => (
                            <li
                                key={`${option.optionGroupId}-${option.optionGroupItemId}`}
                            >
                                {option.optionGroupName}: {option.subItemName} -{" "}
                                {formatPrice(option.priceCents)}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    );
}
