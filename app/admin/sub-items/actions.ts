"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * 检查当前用户是否是管理员
 */
async function requireAdmin() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as any).role !== "ADMIN") {
        redirect("/menu");
    }

    return session;
}

/**
 * 新增附属项
 *
 * 对应数据库：
 * sub_items
 *
 * 注意：
 * SubItem 现在不存价格。
 * 价格以后在 OptionGroupItem.priceCents 里设置。
 */
export async function createSubItem(formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();

    if (!name) {
        throw new Error("附属项名称不能为空");
    }

    await prisma.subItem.create({
        data: {
            name,
        },
    });

    redirect("/admin/sub-items");
}