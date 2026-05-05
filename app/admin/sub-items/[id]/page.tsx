import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../../LanguageSwitcher";
import { updateSubItem } from "../actions";

export default async function AdminSubItemEditPage({
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
    const subItemId = Number(id);

    if (!Number.isInteger(subItemId) || subItemId <= 0) {
        redirect("/admin/sub-items");
    }

    const item = await prisma.subItem.findUnique({
        where: {
            id: subItemId,
        },
    });

    if (!item) {
        redirect("/admin/sub-items");
    }

    const updateAction = updateSubItem.bind(null, subItemId);

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin/sub-items">
                        {t("backToSubItems")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 32 }}>
                <h1>{t("editSubItem")}</h1>
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
