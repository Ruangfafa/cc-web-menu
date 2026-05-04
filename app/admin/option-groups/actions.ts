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
 * 新增选项组
 *
 * 对应数据库：
 * option_groups
 *
 * 例子：
 * - 辣度：必选，1选1
 * - 加购项：非必选，最多选3
 * - 饮料：必选，1选1
 * - 小菜三选二：必选，2选2
 */
export async function createOptionGroup(formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();

    const isRequired = formData.get("isRequired") === "on";

    const minSelect = Number(formData.get("minSelect") || 0);
    const maxSelect = Number(formData.get("maxSelect") || 1);
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!name) {
        throw new Error("选项组名称不能为空");
    }

    if (!Number.isInteger(minSelect) || minSelect < 0) {
        throw new Error("最少选择数量不合法");
    }

    if (!Number.isInteger(maxSelect) || maxSelect < 0) {
        throw new Error("最多选择数量不合法");
    }

    if (maxSelect < minSelect) {
        throw new Error("最多选择数量不能小于最少选择数量");
    }

    if (!Number.isInteger(sortOrder)) {
        throw new Error("排序值不合法");
    }

    await prisma.optionGroup.create({
        data: {
            name,
            description: description || null,
            isRequired,
            minSelect,
            maxSelect,
            sortOrder,
        },
    });

    redirect("/admin/option-groups");
}

export async function deleteOptionGroup(formData: FormData) {
    await requireAdmin();

    const optionGroupId = Number(formData.get("optionGroupId"));

    if (!Number.isInteger(optionGroupId) || optionGroupId <= 0) {
        throw new Error("Invalid option group id.");
    }

    await prisma.$transaction(async (tx) => {
        await tx.menuItemOptionGroup.deleteMany({
            where: {
                optionGroupId,
            },
        });

        await tx.optionGroupItem.deleteMany({
            where: {
                optionGroupId,
            },
        });

        await tx.optionGroup.delete({
            where: {
                id: optionGroupId,
            },
        });
    });

    redirect("/admin/option-groups");
}
