"use server";

import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function requireAdmin() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }
}

/**
 * 更新用户角色和启用状态
 *
 * 路径：
 * Server Action in /admin/users
 *
 * 功能：
 * 让管理员在后台维护用户身份和是否可登录。
 */
export async function updateUserManagement(formData: FormData) {
    await requireAdmin();

    const userId = Number(formData.get("userId"));
    const role = String(formData.get("role") || "");
    const isActive = formData.get("isActive") === "on";

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Invalid user id.");
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
        throw new Error("Invalid user role.");
    }

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            role: role as UserRole,
            isActive,
        },
    });

    redirect("/admin/users");
}
