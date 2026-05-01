"use client";

import { useSession, signOut } from "next-auth/react";

/**
 * 首页
 *
 * 功能：
 * 1. 显示网站标题
 * 2. 检查用户是否已经登录
 * 3. 如果已登录，显示用户信息和 Logout 按钮
 * 4. 如果未登录，显示 Login / Register 链接
 */
export default function HomePage() {
    /**
     * data: session
     * - 如果用户已登录，session 里会有 user 信息
     *
     * status:
     * - "loading"：正在检查登录状态
     * - "authenticated"：已登录
     * - "unauthenticated"：未登录
     */
    const { data: session, status } = useSession();

    return (
        <main style={{ maxWidth: 800, margin: "80px auto", padding: 24 }}>
            <h1>C&C Web Menu</h1>

            <p>Kitchen online menu and ordering system.</p>

            {status === "loading" && (
                <p>Checking login status...</p>
            )}

            {status === "authenticated" && (
                <section
                    style={{
                        marginTop: 24,
                        padding: 16,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                    }}
                >
                    <h2>Logged in</h2>

                    <p>
                        <strong>Name:</strong>{" "}
                        {session.user?.name || "No name"}
                    </p>

                    <p>
                        <strong>Email:</strong>{" "}
                        {session.user?.email || "No email"}
                    </p>

                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        style={{
                            marginTop: 12,
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                </section>
            )}

            {status === "unauthenticated" && (
                <section style={{ marginTop: 24 }}>
                    <p>You are not logged in.</p>

                    <div style={{ display: "flex", gap: 12 }}>
                        <a
                            href="/login"
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #333",
                                borderRadius: 6,
                                textDecoration: "none",
                            }}
                        >
                            Login
                        </a>

                        <a
                            href="/register"
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #333",
                                borderRadius: 6,
                                textDecoration: "none",
                            }}
                        >
                            Register
                        </a>
                    </div>
                </section>
            )}
        </main>
    );
}