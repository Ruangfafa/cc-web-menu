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
 * 给某个 OptionGroup 添加一个 SubItem
 *
 * 对应数据库：
 * option_group_items
 *
 * 含义：
 * 把一个已有的 sub_item 放进某个 option_group 里，
 * 并设置它在这个组里的价格。
 */
export async function addSubItemToOptionGroup(
    optionGroupId: number,
    formData: FormData
) {
    await requireAdmin();

    /**
     * 从表单读取字段
     */
    const subItemId = Number(formData.get("subItemId"));
    const priceDollars = String(formData.get("priceDollars") || "0").trim();
    const isDefault = formData.get("isDefault") === "on";
    const isAvailable = formData.get("isAvailable") === "on";
    const sortOrder = Number(formData.get("sortOrder") || 0);

    /**
     * 基础检查
     */
    if (!Number.isInteger(optionGroupId) || optionGroupId <= 0) {
        throw new Error("选项组 ID 不合法");
    }

    if (!Number.isInteger(subItemId) || subItemId <= 0) {
        throw new Error("请选择一个附属项");
    }

    const priceCents = Math.round(Number(priceDollars) * 100);

    if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new Error("价格不合法");
    }

    if (!Number.isInteger(sortOrder)) {
        throw new Error("排序值不合法");
    }

    /**
     * 确认 option group 存在
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
     * 确认 sub item 存在
     */
    const subItem = await prisma.subItem.findUnique({
        where: {
            id: subItemId,
        },
    });

    if (!subItem) {
        throw new Error("附属项不存在");
    }

    /**
     * 创建 OptionGroupItem
     *
     * 注意：
     * 价格存在 option_group_items.priceCents。
     * SubItem 本身不存价格。
     */
    await prisma.optionGroupItem.create({
        data: {
            optionGroupId,
            subItemId,
            priceCents,
            isDefault,
            isAvailable,
            sortOrder,
        },
    });

    redirect(`/admin/option-groups/${optionGroupId}`);
}