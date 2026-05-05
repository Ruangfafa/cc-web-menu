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

export async function deleteSubItem(formData: FormData) {
    await requireAdmin();

    const subItemId = Number(formData.get("subItemId"));

    if (!Number.isInteger(subItemId) || subItemId <= 0) {
        throw new Error("Invalid sub item id.");
    }

    await prisma.$transaction(async (tx) => {
        await tx.optionGroupItem.deleteMany({
            where: {
                subItemId,
            },
        });

        await tx.subItem.delete({
            where: {
                id: subItemId,
            },
        });
    });

    redirect("/admin/sub-items");
}

export async function updateSubItem(subItemId: number, formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();

    if (!Number.isInteger(subItemId) || subItemId <= 0) {
        throw new Error("Invalid sub item id.");
    }

    if (!name) {
        throw new Error("Name is required.");
    }

    await prisma.subItem.update({
        where: {
            id: subItemId,
        },
        data: {
            name,
        },
    });

    redirect("/admin/sub-items");
}
