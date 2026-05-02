import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * NextAuth 配置（使用邮箱 + 密码登录）
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",

            /**
             * 定义前端传入的字段
             *
             * 你的 login 页面中 signIn("credentials") 会传：
             * - email
             * - password
             */
            credentials: {
                email: {},
                password: {},
            },

            /**
             * 登录校验逻辑
             *
             * 返回 user 对象 → 登录成功
             * 返回 null → 登录失败
             */
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                /**
                 * 1. 检查 email / password 是否存在
                 */
                if (!email || !password) {
                    return null;
                }

                /**
                 * 2. 统一 email 格式
                 *
                 * 注册时我们保存的是小写邮箱，
                 * 所以登录时也转成小写再查。
                 */
                const normalizedEmail = email.trim().toLowerCase();

                /**
                 * 3. 根据邮箱查用户
                 */
                const user = await prisma.user.findUnique({
                    where: {
                        email: normalizedEmail,
                    },
                });

                /**
                 * 4. 用户不存在，登录失败
                 */
                if (!user) {
                    return null;
                }

                /**
                 * 5. 如果用户被禁用，不允许登录
                 */
                if (!user.isActive) {
                    return null;
                }

                /**
                 * 6. 校验密码
                 *
                 * password：用户输入的明文密码
                 * user.passwordHash：数据库里的 bcrypt hash
                 */
                const isValid = await bcrypt.compare(
                    password,
                    user.passwordHash
                );

                if (!isValid) {
                    return null;
                }

                /**
                 * 7. 登录成功
                 *
                 * 注意：
                 * 不要返回 passwordHash。
                 *
                 * 这里要返回 name，
                 * 否则前端 session.user.name 会是空的。
                 */
                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],

    /**
     * 使用 JWT 存 session
     *
     * Credentials Provider 通常使用 jwt session。
     */
    session: {
        strategy: "jwt",
    },

    /**
     * callbacks 用来控制：
     * 1. user 如何写入 token
     * 2. token 如何写入 session
     */
    callbacks: {
        /**
         * jwt callback
         *
         * 登录成功时，authorize() 返回的 user 会传到这里。
         * 我们把 user 的信息保存到 token 里。
         */
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = (user as any).role;
            }

            return token;
        },

        /**
         * session callback
         *
         * 前端 useSession() 读到的是 session。
         * 所以这里要把 token 里的数据放回 session.user。
         */
        async session({ session, token }) {
            if (session.user) {
                session.user.email = token.email as string;
                session.user.name = token.name as string;

                /**
                 * NextAuth 默认类型里没有 id 和 role，
                 * 所以这里先用 as any。
                 *
                 * 后面如果你想更规范，
                 * 可以再做 next-auth.d.ts 类型扩展。
                 */
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
            }

            return session;
        },
    },

    /**
     * 自定义登录页
     */
    pages: {
        signIn: "/login",
    },

    /**
     * 用于加密 session / token
     */
    secret: process.env.AUTH_SECRET,
});