import { auth } from "@/auth";
import { DeliveryAddressMode } from "@prisma/client";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import {
    createSiteAddress,
    deleteSiteAddress,
    updateDeliveryMode,
    updatePickupTimeRequirement,
    updateSiteAddress,
} from "./actions";
import { DeleteSiteAddressButton } from "./DeleteSiteAddressButton";

/**
 * 配送地址模式管理页
 *
 * 路径：
 * GET /admin/delivery
 *
 * 功能：
 * 1. 切换全站配送地址模式
 * 2. 管理站点地址集合
 * 3. 让 checkout 根据后台配置切换地址选择逻辑
 */
export default async function AdminDeliveryPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }

    const deliverySetting = await prisma.deliverySetting.findUnique({
        where: {
            id: 1,
        },
    });
    const siteAddresses = await prisma.siteAddress.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const currentMode =
        deliverySetting?.mode || DeliveryAddressMode.SELF_ADDRESS;
    const requirePickupTime = deliverySetting?.requirePickupTime || false;

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>{session.user.name || t("adminUserFallback")}</strong>
                </p>
                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <a className="menu-action-button" href="/admin">
                        {t("backToAdmin")}
                    </a>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>{t("settings")}</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    {t("settingsAdminDesc")}
                </p>
            </header>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("deliveryMode")}</h2>

                <form action={updateDeliveryMode}>
                    <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value={DeliveryAddressMode.SELF_ADDRESS}
                                defaultChecked={
                                    currentMode === DeliveryAddressMode.SELF_ADDRESS
                                }
                            />{" "}
                            {t("useCustomerAddress")}
                        </label>

                        <p style={{ margin: 0, color: "#666" }}>
                            {t("selfAddressModeDesc")}
                        </p>

                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value={DeliveryAddressMode.SITE_ADDRESS}
                                defaultChecked={
                                    currentMode === DeliveryAddressMode.SITE_ADDRESS
                                }
                            />{" "}
                            {t("useSiteAddress")}
                        </label>

                        <p style={{ margin: 0, color: "#666" }}>
                            {t("siteAddressModeDesc")}
                        </p>
                    </div>

                    <button type="submit">{t("saveSettings")}</button>
                </form>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("pickupTimeRequirement")}</h2>

                <form action={updatePickupTimeRequirement}>
                    <label>
                        <input
                            type="checkbox"
                            name="requirePickupTime"
                            defaultChecked={requirePickupTime}
                        />{" "}
                        {t("requirePickupTime")}
                    </label>

                    <p style={{ color: "#666" }}>
                        {t("pickupRequirementDesc")}
                    </p>

                    <button type="submit">{t("saveSettings")}</button>
                </form>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    background: "#fff",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ marginTop: 0 }}>{t("createSiteAddress")}</h2>

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
                                padding: 8,
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
                                padding: 8,
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
                                padding: 8,
                                marginTop: 4,
                            }}
                        />
                    </div>

                    <label>
                        <input type="checkbox" name="isActive" defaultChecked />{" "}
                        {t("active")}
                    </label>

                    <div style={{ marginTop: 16 }}>
                        <button type="submit">{t("createSiteAddress")}</button>
                    </div>
                </form>
            </section>

            <section>
                <h2>{t("currentSiteAddresses")}</h2>

                {siteAddresses.length === 0 ? (
                    <p style={{ color: "#666" }}>{t("noSiteAddressesYet")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {siteAddresses.map((siteAddress) => (
                            <article
                                key={siteAddress.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
                                    padding: 16,
                                    background: "#fff",
                                }}
                            >
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
                                                padding: 8,
                                                marginTop: 4,
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <label
                                            htmlFor={`address-${siteAddress.id}`}
                                        >
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
                                                padding: 8,
                                                marginTop: 4,
                                                resize: "vertical",
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <label
                                            htmlFor={`sortOrder-${siteAddress.id}`}
                                        >
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
                                                padding: 8,
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

                                    <div style={{ marginTop: 16 }}>
                                        <button type="submit">{t("save")}</button>
                                    </div>
                                </form>

                                <form
                                    action={deleteSiteAddress}
                                    style={{ marginTop: 12 }}
                                >
                                    <input
                                        type="hidden"
                                        name="siteAddressId"
                                        value={siteAddress.id}
                                    />

                                    <DeleteSiteAddressButton
                                        siteAddressName={siteAddress.name}
                                    />
                                </form>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
