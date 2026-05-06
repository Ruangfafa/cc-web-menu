import { auth } from "@/auth";
import { DeliveryAddressMode } from "@prisma/client";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import {
    createDeliveryDistanceTier,
    deleteDeliveryDistanceTier,
    updateDeliveryDistanceTier,
    updateDeliveryMode,
    updateDeliveryPricing,
    updatePickupTimeRequirement,
} from "./actions";
import { CreateSiteAddressCard } from "./CreateSiteAddressCard";
import { DeliveryOriginCard } from "./DeliveryOriginCard";
import { SiteAddressCard } from "./SiteAddressCard";

const BOTH_DELIVERY_MODE = "BOTH" as DeliveryAddressMode;
const DELIVERY_PRICING_BASE_PLUS_DISTANCE = "BASE_PLUS_DISTANCE";
const DELIVERY_PRICING_DISTANCE_TIERS = "DISTANCE_TIERS";

function formatDollars(cents: number | null | undefined) {
    return ((cents || 0) / 100).toFixed(2);
}

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

    const deliverySetting = await (prisma as any).deliverySetting.findUnique({
        where: {
            id: 1,
        },
        include: {
            distanceTiers: {
                orderBy: [{ sortOrder: "asc" }, { minKm: "asc" }, { id: "asc" }],
            },
        },
    });
    const siteAddresses = await prisma.siteAddress.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const currentMode =
        deliverySetting?.mode || DeliveryAddressMode.SELF_ADDRESS;
    const requirePickupTime = deliverySetting?.requirePickupTime || false;
    const pricingMode =
        deliverySetting?.pricingMode || DELIVERY_PRICING_BASE_PLUS_DISTANCE;
    const distanceTiers = deliverySetting?.distanceTiers || [];

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

                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value={BOTH_DELIVERY_MODE}
                                defaultChecked={
                                    currentMode === BOTH_DELIVERY_MODE
                                }
                            />{" "}
                            {t("useBothAddressModes")}
                        </label>

                        <p style={{ margin: 0, color: "#666" }}>
                            {t("bothAddressModeDesc")}
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
                <h2 style={{ marginTop: 0 }}>{t("deliveryOrigin")}</h2>

                <DeliveryOriginCard
                    originAddress={deliverySetting?.originAddress || ""}
                />
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
                <h2 style={{ marginTop: 0 }}>{t("deliveryPricing")}</h2>

                <form action={updateDeliveryPricing}>
                    <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
                        <label>
                            <input
                                type="radio"
                                name="pricingMode"
                                value={DELIVERY_PRICING_BASE_PLUS_DISTANCE}
                                defaultChecked={
                                    pricingMode ===
                                    DELIVERY_PRICING_BASE_PLUS_DISTANCE
                                }
                            />{" "}
                            {t("basePlusDistancePricing")}
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="pricingMode"
                                value={DELIVERY_PRICING_DISTANCE_TIERS}
                                defaultChecked={
                                    pricingMode === DELIVERY_PRICING_DISTANCE_TIERS
                                }
                            />{" "}
                            {t("distanceTierPricing")}
                        </label>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <label htmlFor="baseDeliveryFeeDollars">
                            {t("baseDeliveryFee")}
                            <input
                                id="baseDeliveryFeeDollars"
                                name="baseDeliveryFeeDollars"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={formatDollars(
                                    deliverySetting?.baseDeliveryFeeCents
                                )}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </label>

                        <label htmlFor="perKmDeliveryFeeDollars">
                            {t("perKmDeliveryFee")}
                            <input
                                id="perKmDeliveryFeeDollars"
                                name="perKmDeliveryFeeDollars"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={formatDollars(
                                    deliverySetting?.perKmDeliveryFeeCents
                                )}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: 4,
                                }}
                            />
                        </label>
                    </div>

                    <button type="submit">{t("saveSettings")}</button>
                </form>

                <section style={{ marginTop: 24 }}>
                    <h3>{t("distancePricingTiers")}</h3>

                    <form
                        action={createDeliveryDistanceTier}
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(130px, 1fr))",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <label>
                            {t("minKm")}
                            <input name="minKm" type="number" min="0" step="0.1" required />
                        </label>
                        <label>
                            {t("maxKm")}
                            <input name="maxKm" type="number" min="0" step="0.1" />
                        </label>
                        <label>
                            {t("deliveryFee")}
                            <input name="feeDollars" type="number" min="0" step="0.01" required />
                        </label>
                        <label>
                            {t("sortOrder")}
                            <input name="sortOrder" type="number" defaultValue={0} required />
                        </label>
                        <button type="submit">{t("addTier")}</button>
                    </form>

                    {distanceTiers.length === 0 ? (
                        <p style={{ color: "#666" }}>{t("noDistanceTiers")}</p>
                    ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                            {distanceTiers.map((tier: any) => (
                                <article
                                    key={tier.id}
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 8,
                                        padding: 12,
                                    }}
                                >
                                    <form
                                        action={updateDeliveryDistanceTier}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(130px, 1fr))",
                                            gap: 12,
                                        }}
                                    >
                                        <input type="hidden" name="tierId" value={tier.id} />
                                        <label>
                                            {t("minKm")}
                                            <input name="minKm" type="number" min="0" step="0.1" defaultValue={tier.minKm} required />
                                        </label>
                                        <label>
                                            {t("maxKm")}
                                            <input name="maxKm" type="number" min="0" step="0.1" defaultValue={tier.maxKm ?? ""} />
                                        </label>
                                        <label>
                                            {t("deliveryFee")}
                                            <input name="feeDollars" type="number" min="0" step="0.01" defaultValue={formatDollars(tier.feeCents)} required />
                                        </label>
                                        <label>
                                            {t("sortOrder")}
                                            <input name="sortOrder" type="number" defaultValue={tier.sortOrder} required />
                                        </label>
                                        <button type="submit">{t("save")}</button>
                                    </form>

                                    <form
                                        action={deleteDeliveryDistanceTier}
                                        style={{ marginTop: 8 }}
                                    >
                                        <input type="hidden" name="tierId" value={tier.id} />
                                        <button type="submit">{t("delete")}</button>
                                    </form>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
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

                <CreateSiteAddressCard />
            </section>

            <section>
                <h2>{t("currentSiteAddresses")}</h2>

                {siteAddresses.length === 0 ? (
                    <p style={{ color: "#666" }}>{t("noSiteAddressesYet")}</p>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {siteAddresses.map((siteAddress) => (
                            <SiteAddressCard
                                key={siteAddress.id}
                                siteAddress={siteAddress}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
