"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * 检查当前用户是否是管理员
 *
 * 这个函数只在 server action / server component 里使用。
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
 * 新增基础菜品
 *
 * 对应数据库：
 * general_items
 *
 * 注意：
 * 这里只创建 MainItem。
 * 不创建 MenuItem。
 *
 * 原因：
 * MainItem 是“商品库”。
 * MenuItem 才是“真正显示给顾客的菜单项”。
 */
export async function createMainItem(formData: FormData) {
    await requireAdmin();

    /**
     * 从 HTML form 读取字段
     */
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priceDollars = String(formData.get("priceDollars") || "").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const isAvailable = formData.get("isAvailable") === "on";

    /**
     * 基础校验
     */
    if (!name) {
        throw new Error("菜品名称不能为空");
    }

    const priceCents = Math.round(Number(priceDollars) * 100);

    if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new Error("价格不合法");
    }

    /**
     * 创建基础菜品
     */
    await prisma.mainItem.create({
        data: {
            name,
            description: description || null,
            priceCents,
            imageUrl: imageUrl || null,
            isAvailable,
        },
    });

    /**
     * 创建完成后回到基础菜品管理页
     */
    redirect("/admin/general-items");
}

export async function deleteMainItem(formData: FormData) {
    await requireAdmin();

    const mainItemId = Number(formData.get("mainItemId"));

    if (!Number.isInteger(mainItemId) || mainItemId <= 0) {
        throw new Error("Invalid main item id.");
    }

    await prisma.$transaction(async (tx) => {
        const menuItems = await tx.menuItem.findMany({
            where: {
                mainItemId,
            },
            select: {
                id: true,
            },
        });
        const menuItemIds = menuItems.map((item) => item.id);

        if (menuItemIds.length > 0) {
            await tx.menuItemOptionGroup.deleteMany({
                where: {
                    menuItemId: {
                        in: menuItemIds,
                    },
                },
            });

            await tx.menuItem.deleteMany({
                where: {
                    id: {
                        in: menuItemIds,
                    },
                },
            });
        }

        await tx.mainItem.delete({
            where: {
                id: mainItemId,
            },
        });
    });

    redirect("/admin/general-items");
}

export async function updateMainItem(mainItemId: number, formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priceDollars = String(formData.get("priceDollars") || "").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const isAvailable = formData.get("isAvailable") === "on";

    if (!Number.isInteger(mainItemId) || mainItemId <= 0) {
        throw new Error("Invalid main item id.");
    }

    if (!name) {
        throw new Error("Name is required.");
    }

    const priceCents = Math.round(Number(priceDollars) * 100);

    if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new Error("Invalid price.");
    }

    await prisma.mainItem.update({
        where: {
            id: mainItemId,
        },
        data: {
            name,
            description: description || null,
            priceCents,
            imageUrl: imageUrl || null,
            isAvailable,
        },
    });

    redirect("/admin/general-items");
}
