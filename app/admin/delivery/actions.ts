"use server";

import { auth } from "@/auth";
import { DeliveryAddressMode } from "@prisma/client";
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
 * 更新全站配送地址模式
 */
export async function updateDeliveryMode(formData: FormData) {
    await requireAdmin();

    const mode = String(formData.get("mode") || "");

    if (!Object.values(DeliveryAddressMode).includes(mode as DeliveryAddressMode)) {
        throw new Error("Invalid delivery mode.");
    }

    await prisma.deliverySetting.upsert({
        where: {
            id: 1,
        },
        update: {
            mode: mode as DeliveryAddressMode,
        },
        create: {
            id: 1,
            mode: mode as DeliveryAddressMode,
        },
    });

    redirect("/admin/delivery");
}

export async function updatePickupTimeRequirement(formData: FormData) {
    await requireAdmin();

    const requirePickupTime = formData.get("requirePickupTime") === "on";

    await prisma.deliverySetting.upsert({
        where: {
            id: 1,
        },
        update: {
            requirePickupTime,
        },
        create: {
            id: 1,
            mode: DeliveryAddressMode.SELF_ADDRESS,
            requirePickupTime,
        },
    });

    redirect("/admin/delivery");
}

/**
 * 新增站点地址
 */
export async function createSiteAddress(formData: FormData) {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();
    const fullAddress = String(formData.get("fullAddress") || "").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const isActive = formData.get("isActive") === "on";

    if (!name) {
        throw new Error("Site address name is required.");
    }

    if (!fullAddress) {
        throw new Error("Site address is required.");
    }

    if (!Number.isInteger(sortOrder)) {
        throw new Error("Invalid sort order.");
    }

    await prisma.siteAddress.create({
        data: {
            name,
            fullAddress,
            sortOrder,
            isActive,
        },
    });

    redirect("/admin/delivery");
}

/**
 * 更新站点地址启用状态和排序
 */
export async function updateSiteAddress(formData: FormData) {
    await requireAdmin();

    const siteAddressId = Number(formData.get("siteAddressId"));
    const name = String(formData.get("name") || "").trim();
    const fullAddress = String(formData.get("fullAddress") || "").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const isActive = formData.get("isActive") === "on";

    if (!Number.isInteger(siteAddressId) || siteAddressId <= 0) {
        throw new Error("Invalid site address id.");
    }

    if (!name || !fullAddress) {
        throw new Error("Site address name and full address are required.");
    }

    if (!Number.isInteger(sortOrder)) {
        throw new Error("Invalid sort order.");
    }

    await prisma.siteAddress.update({
        where: {
            id: siteAddressId,
        },
        data: {
            name,
            fullAddress,
            sortOrder,
            isActive,
        },
    });

    redirect("/admin/delivery");
}

export async function deleteSiteAddress(formData: FormData) {
    await requireAdmin();

    const siteAddressId = Number(formData.get("siteAddressId"));

    if (!Number.isInteger(siteAddressId) || siteAddressId <= 0) {
        throw new Error("Invalid site address id.");
    }

    await prisma.siteAddress.delete({
        where: {
            id: siteAddressId,
        },
    });

    redirect("/admin/delivery");
}
