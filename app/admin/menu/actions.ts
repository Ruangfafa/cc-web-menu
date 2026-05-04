"use server";

import { auth } from "@/auth";
import { parseDateKey } from "@/lib/menu-date";
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
 * 创建菜单项
 *
 * 对应数据库：
 * menu_items
 *
 * 作用：
 * 把 general_items 里的基础菜品放到真正顾客菜单中。
 */
export async function createMenuItem(formData: FormData) {
    await requireAdmin();

    const mainItemId = Number(formData.get("mainItemId"));
    const displayName = String(formData.get("displayName") || "").trim();
    const displayDescription = String(
        formData.get("displayDescription") || ""
    ).trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const isActive = formData.get("isActive") === "on";
    const availableDateValue = String(formData.get("availableDate") || "");
    const availableDate = parseDateKey(availableDateValue);

    if (!Number.isInteger(mainItemId) || mainItemId <= 0) {
        throw new Error("请选择一个基础菜品");
    }

    if (!Number.isInteger(sortOrder)) {
        throw new Error("排序值不合法");
    }

    if (!availableDate) {
        throw new Error("Invalid menu date.");
    }

    /**
     * 确认基础菜品存在
     */
    const mainItem = await prisma.mainItem.findUnique({
        where: {
            id: mainItemId,
        },
    });

    if (!mainItem) {
        throw new Error("基础菜品不存在");
    }

    /**
     * 创建真正菜单项
     *
     * 注意：
     * displayName / displayDescription 是可选覆盖字段。
     * 如果为空，顾客菜单页以后就使用 mainItem 自己的 name / description。
     */
    await prisma.menuItem.create({
        data: {
            mainItemId,
            displayName: displayName || null,
            displayDescription: displayDescription || null,
            availableDate,
            sortOrder,
            isActive,
        },
    });

    redirect("/admin/menu");
}

export async function deleteMenuItem(formData: FormData) {
    await requireAdmin();

    const menuItemId = Number(formData.get("menuItemId"));

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
        throw new Error("Invalid menu item id.");
    }

    await prisma.$transaction(async (tx) => {
        await tx.menuItemOptionGroup.deleteMany({
            where: {
                menuItemId,
            },
        });

        await tx.menuItem.delete({
            where: {
                id: menuItemId,
            },
        });
    });

    redirect("/admin/menu");
}
