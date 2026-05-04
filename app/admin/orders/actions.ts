"use server";

import { auth } from "@/auth";
import { OrderFulfillmentStatus, OrderPaymentStatus } from "@prisma/client";
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
 * 更新订单状态
 *
 * 路径：
 * Server Action in /admin/orders
 *
 * 功能：
 * 让管理员在后台直接修改订单状态。
 */
export async function updateOrderStatus(formData: FormData) {
    await requireAdmin();

    const orderId = Number(formData.get("orderId"));
    const paymentStatus = String(formData.get("paymentStatus") || "");
    const fulfillmentStatus = String(formData.get("fulfillmentStatus") || "");
    const loadedUpdatedAt = String(formData.get("updatedAt") || "");

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid order id.");
    }

    if (!loadedUpdatedAt) {
        throw new Error("Missing order update timestamp.");
    }

    const loadedUpdatedAtDate = new Date(loadedUpdatedAt);

    if (Number.isNaN(loadedUpdatedAtDate.getTime())) {
        throw new Error("Invalid order update timestamp.");
    }

    if (
        !Object.values(OrderPaymentStatus).includes(
            paymentStatus as OrderPaymentStatus
        )
    ) {
        throw new Error("Invalid payment status.");
    }

    if (
        !Object.values(OrderFulfillmentStatus).includes(
            fulfillmentStatus as OrderFulfillmentStatus
        )
    ) {
        throw new Error("Invalid fulfillment status.");
    }

    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            updatedAt: loadedUpdatedAtDate,
        },
        data: {
            paymentStatus: paymentStatus as OrderPaymentStatus,
            fulfillmentStatus: fulfillmentStatus as OrderFulfillmentStatus,
        },
    });

    if (result.count === 0) {
        redirect("/admin/orders?conflict=1");
    }

    redirect("/admin/orders");
}

export async function saveOrderComment(formData: FormData) {
    await requireAdmin();

    const orderId = Number(formData.get("orderId"));
    const comment = String(formData.get("comment") || "").trim();
    const loadedUpdatedAt = String(formData.get("updatedAt") || "");

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid order id.");
    }

    if (!loadedUpdatedAt) {
        throw new Error("Missing order update timestamp.");
    }

    const loadedUpdatedAtDate = new Date(loadedUpdatedAt);

    if (Number.isNaN(loadedUpdatedAtDate.getTime())) {
        throw new Error("Invalid order update timestamp.");
    }

    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            updatedAt: loadedUpdatedAtDate,
        },
        data: {
            comment: comment || null,
        },
    });

    if (result.count === 0) {
        redirect("/admin/orders?conflict=1");
    }

    redirect("/admin/orders");
}
