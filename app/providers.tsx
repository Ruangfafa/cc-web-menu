"use client";

import { SessionProvider } from "next-auth/react";

/**
 * 全局 Provider
 *
 * 作用：
 * 1. 给整个前端提供 NextAuth session
 * 2. 让客户端组件可以使用 useSession()
 * 3. 后面购物车、账号页面、订单页面都会用到登录状态
 */
export default function Providers({
                                      children,
                                  }: {
    children: React.ReactNode;
}) {
    return <SessionProvider>{children}</SessionProvider>;
}