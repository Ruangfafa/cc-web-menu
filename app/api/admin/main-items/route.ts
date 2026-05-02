import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * 管理员主菜 API
 *
 * 路径：
 * GET /api/admin/main-items
 * POST /api/admin/main-items
 *
 * 功能：
 * 1. GET：管理员查看所有主菜
 * 2. POST：管理员新增主菜
 *
 * 安全：
 * 只有 ADMIN 可以访问。
 */
export async function GET() {
    try {
        /**
         * 1. 读取当前登录 session
         */
        const session = await auth();

        /**
         * 2. 未登录，返回 401
         */
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        /**
         * 3. 非管理员，返回 403
         */
        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        /**
         * 4. 管理员可以看到所有菜品
         *
         * 包括：
         * - isAvailable = true
         * - isAvailable = false
         */
        const mainItems = await prisma.mainItem.findMany({
            orderBy: {
                id: "asc",
            },
        });

        return NextResponse.json(
            { mainItems },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin get main items error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * 新增主菜
 */
export async function POST(request: Request) {
    try {
        /**
         * 1. 读取当前登录 session
         */
        const session = await auth();

        /**
         * 2. 未登录，返回 401
         */
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        /**
         * 3. 非管理员，返回 403
         */
        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        /**
         * 4. 读取前端发送的 JSON
         *
         * 例子：
         * {
         *   "name": "Kung Pao Chicken",
         *   "description": "Spicy chicken with peanuts",
         *   "priceCents": 1299,
         *   "imageUrl": "",
         *   "isAvailable": true
         * }
         */
        const body = await request.json();

        const name = body.name as string;
        const description = body.description as string | undefined;
        const priceCents = Number(body.priceCents);
        const imageUrl = body.imageUrl as string | undefined;
        const isAvailable =
            typeof body.isAvailable === "boolean"
                ? body.isAvailable
                : true;

        /**
         * 5. 检查菜品名称
         */
        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Item name is required" },
                { status: 400 }
            );
        }

        /**
         * 6. 检查价格
         *
         * priceCents 是整数分：
         * - 1299 = $12.99
         */
        if (!Number.isInteger(priceCents) || priceCents < 0) {
            return NextResponse.json(
                { error: "Invalid price" },
                { status: 400 }
            );
        }

        /**
         * 7. 创建主菜
         */
        const mainItem = await prisma.mainItem.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                priceCents,
                imageUrl: imageUrl?.trim() || null,
                isAvailable,
            },
        });

        /**
         * 8. 返回创建结果
         */
        return NextResponse.json(
            {
                message: "Main item created successfully",
                mainItem,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Admin create main item error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}