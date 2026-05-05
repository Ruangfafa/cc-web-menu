import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import Providers from "./providers";
import "./globals.css";

/**
 * 网站 metadata
 */
export const metadata: Metadata = {
    title: "C&C Web Menu",
    description: "Kitchen online menu and ordering system",
};

/**
 * RootLayout
 *
 * 注意：
 * Next.js App Router 的根 layout 必须包含：
 * 1. <html>
 * 2. <body>
 *
 * Providers 放在 body 里面，让所有页面都能读取 session。
 */
export default async function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();

    return (
        <html lang={locale === "zh" ? "zh-CN" : "en"}>
        <body>
        <Providers locale={locale}>
            {children}
        </Providers>
        </body>
        </html>
    );
}
