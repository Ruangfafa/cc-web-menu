"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "./LanguageProvider";
import type { Locale } from "@/lib/i18n";

/**
 * 全局 Provider
 *
 * 作用：
 * 1. 给整个前端提供 NextAuth session
 * 2. 让客户端组件可以使用 useSession()
 * 3. 后面购物车、账号页面、订单页面都会用到登录状态
 */
export default function Providers({
                                      locale,
                                      children,
                                  }: {
    locale: Locale;
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        </SessionProvider>
    );
}
