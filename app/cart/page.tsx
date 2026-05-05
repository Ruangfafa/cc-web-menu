import { auth } from "@/auth";
import Link from "next/link";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { LanguageSwitcher } from "../LanguageSwitcher";
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
export default async function CartPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();

    return (
        <main className="page-shell">
            <section className="menu-user-bar">
                <p style={{ margin: 0 }}>
                    <strong>
                        {session?.user
                            ? t("helloUser", {
                                  name: session.user.name || t("user"),
                              })
                            : t("notLoggedIn")}
                    </strong>
                </p>

                <div className="menu-user-actions">
                    <LanguageSwitcher />
                    <Link className="menu-action-button" href="/menu">
                        {t("backToMenu")}
                    </Link>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>{t("yourCart")}</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    {t("cartIntro")}
                </p>
            </header>

            <CartClient />
        </main>
    );
}
