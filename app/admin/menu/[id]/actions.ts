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
 * 给某个菜单项绑定一个选项组
 *
 * 对应数据库：
 * menu_item_option_groups
 *
 * 含义：
 * 让某个 menu_item 使用某个 option_group。
 *
 * 例如：
 * Kung Pao Chicken 使用：
 * - 辣度
 * - 加购项
 */
export async function addOptionGroupToMenuItem(
    menuItemId: number,
    formData: FormData
) {
    await requireAdmin();

    const optionGroupId = Number(formData.get("optionGroupId"));
    const sortOrder = Number(formData.get("sortOrder") || 0);

    /**
     * 检查 menuItemId
     */
    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
        throw new Error("菜单项 ID 不合法");
    }

    /**
     * 检查 optionGroupId
     */
    if (!Number.isInteger(optionGroupId) || optionGroupId <= 0) {
        throw new Error("请选择一个选项组");
    }

    /**
     * 检查 sortOrder
     */
    if (!Number.isInteger(sortOrder)) {
        throw new Error("排序值不合法");
    }

    /**
     * 确认菜单项存在
     */
    const menuItem = await prisma.menuItem.findUnique({
        where: {
            id: menuItemId,
        },
    });

    if (!menuItem) {
        throw new Error("菜单项不存在");
    }

    /**
     * 确认选项组存在
     */
    const optionGroup = await prisma.optionGroup.findUnique({
        where: {
            id: optionGroupId,
        },
    });

    if (!optionGroup) {
        throw new Error("选项组不存在");
    }

    /**
     * 创建绑定关系
     *
     * 因为 schema 里有：
     * @@unique([menuItemId, optionGroupId])
     *
     * 所以同一个菜单项不能重复绑定同一个选项组。
     */
    await prisma.menuItemOptionGroup.create({
        data: {
            menuItemId,
            optionGroupId,
            sortOrder,
        },
    });

    redirect(`/admin/menu/${menuItemId}`);
}

export async function deleteMenuItemOptionGroup(formData: FormData) {
    await requireAdmin();

    const menuItemId = Number(formData.get("menuItemId"));
    const menuItemOptionGroupId = Number(formData.get("menuItemOptionGroupId"));

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
        throw new Error("Invalid menu item id.");
    }

    if (
        !Number.isInteger(menuItemOptionGroupId) ||
        menuItemOptionGroupId <= 0
    ) {
        throw new Error("Invalid menu item option group id.");
    }

    await prisma.menuItemOptionGroup.deleteMany({
        where: {
            id: menuItemOptionGroupId,
            menuItemId,
        },
    });

    redirect(`/admin/menu/${menuItemId}`);
}
