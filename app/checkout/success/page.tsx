import Link from "next/link";

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

    return (
        <main style={{ maxWidth: 700, margin: "80px auto", padding: 24 }}>
            <h1>Order Created</h1>

            <p style={{ color: "#666" }}>
                Your order has been created successfully.
            </p>

            <p>
                <strong>Order ID:</strong> {orderId || "Unknown"}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/menu">Back to menu</Link>
                <Link href="/cart">Back to cart</Link>
            </div>
        </main>
    );
}
