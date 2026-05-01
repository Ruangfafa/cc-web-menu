import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 菜单 API
 *
 * 路径：
 * GET /api/menu
 *
 * 功能：
 * 1. 从 MySQL 读取所有主菜 MainItem
 * 2. 从 MySQL 读取所有子项 SubItem
 * 3. 分开返回给前端
 *
 * 注意：
 * 你当前的 schema.prisma 中：
 * - MainItem 和 SubItem 没有 relation
 * - 所以这里不能写 include: { subItems: true }
 */
export async function GET() {
    try {
        /**
         * 1. 查询所有主菜
         *
         * isAvailable: true
         * - 只显示可用菜品
         *
         * orderBy id asc
         * - 按 id 从小到大显示
         */
        const mainItems = await prisma.mainItem.findMany({
            where: {
                isAvailable: true,
            },
            orderBy: {
                id: "asc",
            },
        });

        /**
         * 2. 查询所有子项
         *
         * 例如：
         * - 加饭
         * - 加蛋
         * - 加辣
         * - 饮料
         *
         * 目前它们和主菜没有绑定关系，
         * 所以前端可以把它们作为通用加购项显示。
         */
        const subItems = await prisma.subItem.findMany({
            orderBy: {
                id: "asc",
            },
        });

        /**
         * 3. 返回菜单数据
         */
        return NextResponse.json(
            {
                mainItems,
                subItems,
            },
            { status: 200 }
        );
    } catch (error) {
        /**
         * 4. 捕获服务器错误
         */
        console.error("Get menu error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}