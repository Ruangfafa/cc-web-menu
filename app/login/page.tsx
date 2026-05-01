"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * 登录页面
 *
 * 路径：
 * GET /login
 *
 * 功能：
 * 1. 让用户输入 email 和 password
 * 2. 调用 NextAuth 的 signIn("credentials")
 * 3. NextAuth 会执行 auth.ts 里的 authorize()
 * 4. authorize() 会：
 *    - 根据 email 查找用户
 *    - 使用 bcrypt.compare 校验密码
 *    - 成功后返回 user
 * 5. 登录成功后跳转首页
 */
export default function LoginPage() {
    /**
     * email：用户输入的邮箱
     * password：用户输入的密码
     * error：登录失败时显示错误信息
     * loading：防止用户重复点击登录按钮
     */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * 提交登录表单
     */
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        /**
         * 每次提交前先清空旧错误
         */
        setError("");
        setLoading(true);

        /**
         * 调用 NextAuth 登录
         *
         * redirect: false
         * - 不让 NextAuth 自动跳转
         * - 我们自己根据 result 判断成功或失败
         */
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        /**
         * 如果 result.error 存在，说明登录失败
         */
        if (result?.error) {
            setError("Invalid email or password");
            return;
        }

        /**
         * 登录成功后跳转首页
         */
        window.location.href = "/";
    }

    return (
        <main style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            padding: 8,
                            marginTop: 4,
                        }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            padding: 8,
                            marginTop: 4,
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: "red", marginBottom: 16 }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: 10,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
}