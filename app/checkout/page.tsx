import { auth } from "@/auth";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { DeliveryAddressMode } from "@prisma/client";
import Link from "next/link";
import { LanguageSwitcher } from "../LanguageSwitcher";
import CheckoutClient from "./CheckoutClient";

/**
 * 结账基础页
 *
 * 路径：
 * GET /checkout
 *
 * 功能：
 * 1. 读取当前登录状态
 * 2. 如果已登录，则读取用户基础信息和地址
 * 3. 把用户信息传给客户端表单
 * 4. 客户端再结合 localStorage 购物车做最终展示
 *
 * 为什么先拆成这样：
 * - 用户资料和地址在数据库里，适合服务端读取
 * - 购物车还在 localStorage，适合客户端读取
 */
export default async function CheckoutPage() {
    const t = createTranslator(await getLocale());
    const session = await auth();
    const deliverySetting = await prisma.deliverySetting.findUnique({
        where: {
            id: 1,
        },
    });
    const siteAddresses = await prisma.siteAddress.findMany({
        where: {
            isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    const deliveryMode =
        deliverySetting?.mode || DeliveryAddressMode.SELF_ADDRESS;
    const requirePickupTime = deliverySetting?.requirePickupTime || false;

    let userProfile: {
        name: string;
        email: string;
        phone: string;
        addresses: Array<{
            id: number;
            fullAddress: string;
            isDefault: boolean;
        }>;
    } | null = null;

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
            include: {
                addresses: {
                    orderBy: [
                        {
                            isDefault: "desc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                },
            },
        });

        if (user) {
            userProfile = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                addresses: user.addresses.map((address) => ({
                    id: address.id,
                    fullAddress: address.fullAddress,
                    isDefault: address.isDefault,
                })),
            };
        }
    }

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
                    <Link className="menu-action-button" href="/cart">
                        {t("backToCart")}
                    </Link>
                    <Link className="menu-action-button" href="/menu">
                        {t("backToMenu")}
                    </Link>
                </div>
            </section>

            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px" }}>{t("checkout")}</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    {t("checkoutIntro")}
                </p>
            </header>

            <CheckoutClient
                deliveryMode={deliveryMode}
                requirePickupTime={requirePickupTime}
                isLoggedIn={Boolean(session?.user)}
                siteAddresses={siteAddresses.map((address) => ({
                    id: address.id,
                    name: address.name,
                    fullAddress: address.fullAddress,
                }))}
                userProfile={userProfile}
            />
        </main>
    );
}
