import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import {
    formatMenuDate,
    parseDateKey,
    todayDateKey,
    toDateKey,
} from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LanguageSwitcher } from "../LanguageSwitcher";

function formatPrice(priceCents: number) {
    return `$${(priceCents / 100).toFixed(2)}`;
}

export default async function MenuPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { date } = await searchParams;
    const t = createTranslator(await getLocale());
    const session = await auth();
    const todayKey = todayDateKey();
    const requestedDateKey = date || todayKey;
    const requestedDate = parseDateKey(requestedDateKey);
    const selectedDateKey =
        requestedDate && requestedDateKey >= todayKey ? requestedDateKey : todayKey;
    const selectedDate = parseDateKey(selectedDateKey) || new Date();
    const todayDate = parseDateKey(todayKey) || new Date();

    const availableMenuDates = await prisma.menuItem.findMany({
        where: {
            isActive: true,
            availableDate: {
                gte: todayDate,
            },
            mainItem: {
                isAvailable: true,
            },
        },
        distinct: ["availableDate"],
        orderBy: {
            availableDate: "asc",
        },
        select: {
            availableDate: true,
        },
    });
    const menuDateOptions = availableMenuDates.map((item) =>
        toDateKey(item.availableDate)
    );

    const menuItems = await prisma.menuItem.findMany({
        where: {
            isActive: true,
            availableDate: selectedDate,
            mainItem: {
                isAvailable: true,
            },
        },
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                id: "asc",
            },
        ],
        include: {
            mainItem: true,
            optionGroups: {
                orderBy: [
                    {
                        sortOrder: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
                include: {
                    optionGroup: {
                        include: {
                            options: {
                                where: {
                                    isAvailable: true,
                                },
                                orderBy: [
                                    {
                                        sortOrder: "asc",
                                    },
                                    {
                                        id: "asc",
                                    },
                                ],
                                include: {
                                    subItem: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                {session?.user ? (
                    <>
                        <p style={{ margin: 0 }}>
                            <strong>
                                {t("helloUser", {
                                    name: session.user.name || t("user"),
                                })}
                            </strong>
                        </p>

                        <div className="menu-user-actions">
                            {(session.user as { role?: string }).role === "ADMIN" && (
                                <Link className="menu-action-button" href="/admin">
                                    {t("adminDashboard")}
                                </Link>
                            )}
                            <LanguageSwitcher />
                            <Link className="menu-action-button" href="/cart">
                                {t("cart")}
                            </Link>
                            <Link className="menu-action-button" href="/account">
                                {t("account")}
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ margin: 0 }}>
                            <strong>{t("notLoggedIn")}</strong>
                        </p>

                        <div className="menu-user-actions">
                            <LanguageSwitcher />
                            <Link className="menu-action-button" href="/cart">
                                {t("cart")}
                            </Link>
                            <Link className="menu-action-button" href="/login">
                                {t("login")}
                            </Link>
                            <Link className="menu-action-button" href="/register">
                                {t("register")}
                            </Link>
                        </div>
                    </>
                )}
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>{t("menuTitle")}</h1>
                <p style={{ color: "#666" }}>
                    {t("showingMenuFor", {
                        date: formatMenuDate(selectedDateKey),
                    })}
                </p>
            </header>

            <section style={{ marginBottom: 28 }}>
                <h2>{t("chooseMenuDate")}</h2>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[todayKey, ...menuDateOptions]
                        .filter(
                            (value, index, values) =>
                                values.indexOf(value) === index
                        )
                        .map((dateKey) => {
                            const isSelected = dateKey === selectedDateKey;

                            return (
                                <Link
                                    key={dateKey}
                                    href={`/menu?date=${dateKey}`}
                                    style={{
                                        display: "inline-block",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: isSelected
                                            ? "1px solid #111"
                                            : "1px solid #ccc",
                                        background: isSelected ? "#111" : "#fff",
                                        color: isSelected ? "#fff" : "#111",
                                        textDecoration: "none",
                                    }}
                                >
                                    {formatMenuDate(dateKey)}
                                </Link>
                            );
                        })}
                </div>
            </section>

            <section>
                <h2>{t("menuItems")}</h2>

                {menuItems.length === 0 ? (
                    <p style={{ color: "#666" }}>
                        {t("noActiveMenuItems", {
                            date: formatMenuDate(selectedDateKey),
                        })}
                    </p>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 16,
                            marginTop: 16,
                        }}
                    >
                        {menuItems.map((menuItem) => {
                            const displayName =
                                menuItem.displayName || menuItem.mainItem.name;
                            const displayDescription =
                                menuItem.displayDescription ||
                                menuItem.mainItem.description ||
                                t("noDescription");

                            return (
                                <article
                                    key={menuItem.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 10,
                                        padding: 16,
                                        background: "#fff",
                                    }}
                                >
                                    {menuItem.mainItem.imageUrl ? (
                                        <img
                                            src={menuItem.mainItem.imageUrl}
                                            alt={displayName}
                                            style={{
                                                width: "100%",
                                                height: 160,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                                marginBottom: 12,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: 160,
                                                borderRadius: 8,
                                                marginBottom: 12,
                                                background: "#f2f2f2",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#999",
                                            }}
                                        >
                                            {t("noImage")}
                                        </div>
                                    )}

                                    <h3 style={{ margin: "0 0 8px" }}>
                                        {displayName}
                                    </h3>

                                    <p
                                        style={{
                                            color: "#666",
                                            margin: "0 0 12px",
                                        }}
                                    >
                                        {displayDescription}
                                    </p>

                                    <p
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: 18,
                                            margin: "0 0 16px",
                                        }}
                                    >
                                        {formatPrice(menuItem.mainItem.priceCents)}
                                    </p>

                                    {menuItem.optionGroups.length === 0 ? (
                                        <p style={{ color: "#666" }}>
                                            {t("noExtraOptionsForItem")}
                                        </p>
                                    ) : (
                                        <div>
                                            <h4>{t("options")}</h4>

                                            {menuItem.optionGroups.map((relation) => {
                                                const group = relation.optionGroup;

                                                return (
                                                    <section
                                                        key={relation.id}
                                                        style={{
                                                            marginTop: 12,
                                                            paddingTop: 12,
                                                            borderTop:
                                                                "1px solid #eee",
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontWeight: "bold",
                                                                margin: "0 0 4px",
                                                            }}
                                                        >
                                                            {group.name}
                                                        </p>

                                                        <p
                                                            style={{
                                                                color: "#666",
                                                                margin: "0 0 8px",
                                                            }}
                                                        >
                                                            {t("groupRules", {
                                                                type: group.isRequired
                                                                    ? t("required")
                                                                    : t("optional"),
                                                                min: group.minSelect,
                                                                max: group.maxSelect,
                                                            })}
                                                        </p>

                                                        {group.description && (
                                                            <p
                                                                style={{
                                                                    color: "#666",
                                                                    margin:
                                                                        "0 0 8px",
                                                                }}
                                                            >
                                                                {group.description}
                                                            </p>
                                                        )}

                                                        {group.options.length === 0 ? (
                                                            <p
                                                                style={{
                                                                    color: "#999",
                                                                }}
                                                            >
                                                                {t("noOptionsInGroup")}
                                                            </p>
                                                        ) : (
                                                            <ul>
                                                                {group.options.map(
                                                                    (option) => (
                                                                        <li key={option.id}>
                                                                            {
                                                                                option
                                                                                    .subItem
                                                                                    .name
                                                                            }{" "}
                                                                            -{" "}
                                                                            {formatPrice(
                                                                                option.priceCents
                                                                            )}
                                                                            {option.isDefault
                                                                                ? `, ${t("default")}`
                                                                                : ""}
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        )}
                                                    </section>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <Link
                                        href={`/menu/${menuItem.id}`}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: 6,
                                            border: "1px solid #ccc",
                                            background: "#f7f7f7",
                                            color: "#111",
                                            textAlign: "center",
                                            textDecoration: "none",
                                            marginTop: 16,
                                        }}
                                    >
                                        {t("chooseViewDetails")}
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
