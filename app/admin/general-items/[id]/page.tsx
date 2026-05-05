import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../../LanguageSwitcher";
import { updateMainItem } from "../actions";

function formatDollars(priceCents: number) {
    return (priceCents / 100).toFixed(2);
}

export default async function AdminGeneralItemEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const t = createTranslator(await getLocale());
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    const { id } = await params;
    const mainItemId = Number(id);

    if (!Number.isInteger(mainItemId) || mainItemId <= 0) {
        redirect("/admin/general-items");
    }

    const item = await prisma.mainItem.findUnique({
        where: {
            id: mainItemId,
        },
    });

    if (!item) {
        redirect("/admin/general-items");
    }

    const updateAction = updateMainItem.bind(null, mainItemId);

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin/general-items">
                        {t("backToGeneralItems")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>{t("editGeneralItem")}</h1>
            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                }}
            >
                <form action={updateAction}>
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="name">{t("name")}</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            defaultValue={item.name}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="description">{t("optionGroupDescription")}</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={item.description || ""}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="priceDollars">{t("basePrice")}</label>
                        <input
                            id="priceDollars"
                            name="priceDollars"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={formatDollars(item.priceCents)}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="imageUrl">{t("imageUrl")}</label>
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            type="text"
                            defaultValue={item.imageUrl || ""}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label>
                            <input
                                name="isAvailable"
                                type="checkbox"
                                defaultChecked={item.isAvailable}
                            />{" "}
                            {t("available")}
                        </label>
                    </div>

                    <button
                        className="menu-action-button menu-action-button-primary"
                        type="submit"
                    >
                        {t("saveChanges")}
                    </button>
                </form>
            </section>
        </main>
    );
}
