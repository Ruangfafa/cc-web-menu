import Link from "next/link";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

/**
 * 下单成功页
 *
 * 路径：
 * GET /checkout/success?orderId=123
 */
export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId?: string }>;
}) {
    const { orderId } = await searchParams;
    const t = createTranslator(await getLocale());

    return (
        <main style={{ maxWidth: 700, margin: "80px auto", padding: 24 }}>
            <h1>{t("orderCreated")}</h1>

            <p style={{ color: "#666" }}>
                {t("orderCreatedSuccess")}
            </p>

            <p>
                <strong>{t("orderId")}</strong> {orderId || t("menuDateUnknown")}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/menu">{t("backToMenu")}</Link>
                <Link href="/cart">{t("backToCart")}</Link>
            </div>
        </main>
    );
}
