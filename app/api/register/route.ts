import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * 注册 API
 *
 * 路径：
 * POST /api/register
 *
 * 功能：
 * 1. 接收前端传来的 email / password / name
 * 2. 检查必填字段
 * 3. 检查密码长度
 * 4. 检查邮箱是否已经被注册
 * 5. 使用 bcrypt 加密密码
 * 6. 把新用户写入 MySQL 数据库
 * 7. 返回注册成功的信息
 */
export async function POST(request: Request) {
    try {
        /**
         * 1. 读取请求体 body
         *
         * 前端会发送 JSON，例如：
         * {
         *   "email": "test@example.com",
         *   "password": "password123",
         *   "name": "Test User"
         * }
         */
        const body = await request.json();

        /**
         * 2. 从 body 中取出字段
         *
         * email：用户邮箱，用于登录，必须唯一
         * password：用户明文密码，只会在这里短暂出现，后面会立刻加密
         * name：用户昵称，可选
         */
        const email = body.email as string;
        const password = body.password as string;
        const name = body.name as string;
        const phone = body.phone as string;

        /**
         * 3. 检查必填字段
         *
         * 如果 必填字段 没有传，就返回 400。
         * 400 表示：前端请求的数据不完整。
         */
        if (!email || !password || !name || !phone) {
            return NextResponse.json(
                { error: "Email, password, name and phone are required" },
                { status: 400 }
            );
        }

        /**
         * 4. 简单清理 email
         *
         * trim()：去掉前后空格
         * toLowerCase()：统一转成小写，避免：
         * Test@Email.com 和 test@email.com 被当成两个账号。
         */
        const normalizedEmail = email.trim().toLowerCase();

        /**
         * 5. 检查邮箱格式
         *
         * 这里只做基础检查。
         * 之后如果想更严格，可以换成 zod 或 validator。
         */
        if (!normalizedEmail.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        /**
         * 6. 检查密码长度
         *
         * 密码太短不安全。
         * 这里先要求至少 8 位。
         */
        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        /**
         * 7. 检查邮箱是否已经存在
         *
         * 因为 schema.prisma 里面 email 应该是 @unique，
         * 所以同一个邮箱不能注册两次。
         */
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email is already registered" },
                { status: 409 }
            );
        }

        /**
         * 8. 加密密码
         *
         * 绝对不要把明文 password 存入数据库。
         *
         * bcrypt.hash(password, 12)
         * 12 是 salt rounds，数值越高越安全，但也越慢。
         * 对普通项目来说 10~12 都可以。
         */
        const passwordHash = await bcrypt.hash(password, 12);

        /**
         * 9. 创建用户
         *
         * 写入数据库的是：
         * - normalizedEmail
         * - passwordHash
         * - name
         *
         * 注意：
         * 不保存明文 password。
         */
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                name: name.trim(),
                phone: phone.trim(),
            },

            /**
             * 10. select 控制返回给前端的数据
             *
             * 这里故意不返回 passwordHash。
             * passwordHash 虽然不是明文密码，但也不应该传给前端。
             */
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        /**
         * 11. 注册成功
         *
         * 201 表示 Created，也就是资源创建成功。
         */
        return NextResponse.json(
            {
                message: "User registered successfully",
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        /**
         * 12. 捕获服务器错误
         *
         * 例如：
         * - 数据库连接失败
         * - Prisma 查询失败
         * - JSON 格式错误
         *
         * 为了安全，不把详细错误直接返回给前端。
         */
        console.error("Register error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}