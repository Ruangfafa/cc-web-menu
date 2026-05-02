import Link from "next/link";
import CartClient from "./CartClient";

/**
 * 顾客购物车页面
 *
 * 路径：
 * GET /cart
 *
 * 功能：
 * 1. 展示 localStorage 中的购物车快照
 * 2. 让顾客修改数量、删除条目
 * 3. 计算当前 subtotal
 *
 * 为什么现在先这样做：
 * 当前项目的购物车数据还没有入库，
 * 所以先让页面层能把点餐流程串起来。
 */
export default function CartPage() {
    return (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/menu">Back to menu</Link>
                </p>

                <h1 style={{ margin: "0 0 8px" }}>Your Cart</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    Review your selected items before checkout.
                </p>
            </header>

            <CartClient />
        </main>
    );
}
