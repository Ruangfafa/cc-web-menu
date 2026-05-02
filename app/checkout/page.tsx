import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
    const session = await auth();

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
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
            <header style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px" }}>
                    <Link href="/cart">Back to cart</Link>
                    {" | "}
                    <Link href="/menu">Back to menu</Link>
                </p>

                <h1 style={{ margin: "0 0 8px" }}>Checkout</h1>

                <p style={{ color: "#666", margin: 0 }}>
                    Review your cart and prepare delivery information.
                </p>
            </header>

            <CheckoutClient
                isLoggedIn={Boolean(session?.user)}
                userProfile={userProfile}
            />
        </main>
    );
}
