"use server";

import { auth } from "@/auth";
import {
    getAddressByPlaceId,
    normalizeAddress,
} from "@/lib/address-normalization";
import {
    DELIVERY_PRICING_BASE_PLUS_DISTANCE,
    DELIVERY_PRICING_DISTANCE_TIERS,
} from "@/lib/delivery-pricing";
import { DeliveryAddressMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const deliveryAddressModes = [
    DeliveryAddressMode.SELF_ADDRESS,
    DeliveryAddressMode.SITE_ADDRESS,
    "BOTH" as DeliveryAddressMode,
] as const;
const deliveryPricingModes = [
    DELIVERY_PRICING_BASE_PLUS_DISTANCE,
    DELIVERY_PRICING_DISTANCE_TIERS,
] as const;

async function requireAdmin() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
        redirect("/menu");
    }
}

async function ensureDeliverySetting() {
    const prismaAny = prisma as any;

    return prismaAny.deliverySetting.upsert({
        where: {
            id: 1,
        },
        update: {},
        create: {
            id: 1,
            mode: DeliveryAddressMode.SELF_ADDRESS,
        },
    });
}

async function resolveAddressFromForm(formData: FormData) {
    const fullAddress = String(formData.get("fullAddress") || "").trim();
    const googlePlaceId = String(formData.get("googlePlaceId") || "").trim();
    const googlePlacesSessionToken = String(
        formData.get("googlePlacesSessionToken") || ""
    ).trim();

    if (!fullAddress) {
        throw new Error("Address is required.");
    }

    if (googlePlaceId && googlePlacesSessionToken) {
        return getAddressByPlaceId(googlePlaceId, googlePlacesSessionToken);
    }

    return normalizeAddress(fullAddress);
}

/**
 * 更新全站配送地址模式
 */
export async function updateDeliveryMode(formData: FormData) {
    await requireAdmin();

    const mode = String(formData.get("mode") || "");

    if (!deliveryAddressModes.includes(mode as DeliveryAddressMode)) {
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

export async function updateDeliveryOrigin(formData: FormData) {
    await requireAdmin();

    const normalizedAddress = await resolveAddressFromForm(formData);
    const prismaAny = prisma as any;

    await prismaAny.deliverySetting.upsert({
        where: {
            id: 1,
        },
        update: {
            originAddress: normalizedAddress.fullAddress,
            originGooglePlaceId: normalizedAddress.googlePlaceId,
            originLatitude: normalizedAddress.latitude,
            originLongitude: normalizedAddress.longitude,
        },
        create: {
            id: 1,
            mode: DeliveryAddressMode.SELF_ADDRESS,
            originAddress: normalizedAddress.fullAddress,
            originGooglePlaceId: normalizedAddress.googlePlaceId,
            originLatitude: normalizedAddress.latitude,
            originLongitude: normalizedAddress.longitude,
        },
    });

    redirect("/admin/delivery");
}

export async function updateDeliveryPricing(formData: FormData) {
    await requireAdmin();

    const pricingMode = String(formData.get("pricingMode") || "");
    const baseDeliveryFeeCents = Math.max(
        0,
        Math.round(Number(formData.get("baseDeliveryFeeDollars") || 0) * 100)
    );
    const perKmDeliveryFeeCents = Math.max(
        0,
        Math.round(Number(formData.get("perKmDeliveryFeeDollars") || 0) * 100)
    );

    if (!deliveryPricingModes.includes(pricingMode as any)) {
        throw new Error("Invalid delivery pricing mode.");
    }

    const prismaAny = prisma as any;

    await prismaAny.deliverySetting.upsert({
        where: {
            id: 1,
        },
        update: {
            pricingMode,
            baseDeliveryFeeCents,
            perKmDeliveryFeeCents,
        },
        create: {
            id: 1,
            mode: DeliveryAddressMode.SELF_ADDRESS,
            pricingMode,
            baseDeliveryFeeCents,
            perKmDeliveryFeeCents,
        },
    });

    redirect("/admin/delivery");
}

export async function createDeliveryDistanceTier(formData: FormData) {
    await requireAdmin();
    await ensureDeliverySetting();

    const minKm = Number(formData.get("minKm"));
    const maxKmValue = String(formData.get("maxKm") || "").trim();
    const maxKm = maxKmValue ? Number(maxKmValue) : null;
    const feeCents = Math.max(
        0,
        Math.round(Number(formData.get("feeDollars") || 0) * 100)
    );
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (
        !Number.isFinite(minKm) ||
        minKm < 0 ||
        (maxKm !== null && (!Number.isFinite(maxKm) || maxKm <= minKm)) ||
        !Number.isInteger(sortOrder)
    ) {
        throw new Error("Invalid delivery distance tier.");
    }

    await (prisma as any).deliveryDistanceTier.create({
        data: {
            deliverySettingId: 1,
            minKm,
            maxKm,
            feeCents,
            sortOrder,
        },
    });

    redirect("/admin/delivery");
}

export async function updateDeliveryDistanceTier(formData: FormData) {
    await requireAdmin();

    const tierId = Number(formData.get("tierId"));
    const minKm = Number(formData.get("minKm"));
    const maxKmValue = String(formData.get("maxKm") || "").trim();
    const maxKm = maxKmValue ? Number(maxKmValue) : null;
    const feeCents = Math.max(
        0,
        Math.round(Number(formData.get("feeDollars") || 0) * 100)
    );
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (
        !Number.isInteger(tierId) ||
        tierId <= 0 ||
        !Number.isFinite(minKm) ||
        minKm < 0 ||
        (maxKm !== null && (!Number.isFinite(maxKm) || maxKm <= minKm)) ||
        !Number.isInteger(sortOrder)
    ) {
        throw new Error("Invalid delivery distance tier.");
    }

    await (prisma as any).deliveryDistanceTier.update({
        where: {
            id: tierId,
        },
        data: {
            minKm,
            maxKm,
            feeCents,
            sortOrder,
        },
    });

    redirect("/admin/delivery");
}

export async function deleteDeliveryDistanceTier(formData: FormData) {
    await requireAdmin();

    const tierId = Number(formData.get("tierId"));

    if (!Number.isInteger(tierId) || tierId <= 0) {
        throw new Error("Invalid delivery distance tier id.");
    }

    await (prisma as any).deliveryDistanceTier.delete({
        where: {
            id: tierId,
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
