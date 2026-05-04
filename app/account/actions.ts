"use server";

import { auth, signOut } from "@/auth";
import { buildLocalDateTimeFromDateKey, toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { OrderFulfillmentStatus } from "@prisma/client";
import { redirect } from "next/navigation";

async function requireUser() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return user;
}

export async function updateAccountProfile(formData: FormData) {
    const user = await requireUser();

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const phone2 = String(formData.get("phone2") || "").trim();

    if (!name || !phone) {
        throw new Error("Name and phone are required.");
    }

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            name,
            phone,
            phone2: phone2 || null,
        },
    });

    redirect("/account");
}

export async function createAddress(formData: FormData) {
    const user = await requireUser();

    const fullAddress = String(formData.get("fullAddress") || "").trim();

    if (!fullAddress) {
        throw new Error("Address is required.");
    }

    await prisma.$transaction(async (tx) => {
        const existingAddressCount = await tx.address.count({
            where: {
                userId: user.id,
            },
        });
        const isDefault =
            formData.get("isDefault") === "on" || existingAddressCount === 0;

        if (isDefault) {
            await tx.address.updateMany({
                where: {
                    userId: user.id,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        await tx.address.create({
            data: {
                userId: user.id,
                fullAddress,
                googlePlaceId: `manual:${user.id}:${Date.now()}`,
                latitude: 0,
                longitude: 0,
                isDefault,
            },
        });
    });

    redirect("/account");
}

export async function updateAddress(formData: FormData) {
    const user = await requireUser();

    const addressId = Number(formData.get("addressId"));
    const fullAddress = String(formData.get("fullAddress") || "").trim();

    if (!Number.isInteger(addressId) || addressId <= 0) {
        throw new Error("Invalid address id.");
    }

    if (!fullAddress) {
        throw new Error("Address is required.");
    }

    const result = await prisma.address.updateMany({
        where: {
            id: addressId,
            userId: user.id,
        },
        data: {
            fullAddress,
        },
    });

    if (result.count === 0) {
        throw new Error("Address not found.");
    }

    redirect("/account");
}

export async function setDefaultAddress(formData: FormData) {
    const user = await requireUser();

    const addressId = Number(formData.get("addressId"));

    if (!Number.isInteger(addressId) || addressId <= 0) {
        throw new Error("Invalid address id.");
    }

    const address = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId: user.id,
        },
    });

    if (!address) {
        throw new Error("Address not found.");
    }

    await prisma.$transaction([
        prisma.address.updateMany({
            where: {
                userId: user.id,
            },
            data: {
                isDefault: false,
            },
        }),
        prisma.address.update({
            where: {
                id: addressId,
            },
            data: {
                isDefault: true,
            },
        }),
    ]);

    redirect("/account");
}

export async function deleteAddress(formData: FormData) {
    const user = await requireUser();

    const addressId = Number(formData.get("addressId"));

    if (!Number.isInteger(addressId) || addressId <= 0) {
        throw new Error("Invalid address id.");
    }

    const address = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId: user.id,
        },
    });

    if (!address) {
        throw new Error("Address not found.");
    }

    await prisma.$transaction(async (tx) => {
        await tx.address.delete({
            where: {
                id: addressId,
            },
        });

        if (address.isDefault) {
            const nextAddress = await tx.address.findFirst({
                where: {
                    userId: user.id,
                },
                orderBy: {
                    id: "asc",
                },
            });

            if (nextAddress) {
                await tx.address.update({
                    where: {
                        id: nextAddress.id,
                    },
                    data: {
                        isDefault: true,
                    },
                });
            }
        }
    });

    redirect("/account");
}

export async function cancelOrder(formData: FormData) {
    const user = await requireUser();

    const orderId = Number(formData.get("orderId"));

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid order id.");
    }

    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            userId: user.id,
            fulfillmentStatus: {
                notIn: [
                    OrderFulfillmentStatus.COMPLETED,
                    OrderFulfillmentStatus.CANCELLED,
                    OrderFulfillmentStatus.REFUNDED,
                ],
            },
        },
        data: {
            fulfillmentStatus: OrderFulfillmentStatus.CANCELLED,
        },
    });

    if (result.count === 0) {
        redirect("/account?orderAction=unavailable");
    }

    redirect("/account?orderAction=cancelled");
}

export async function updateOrderPickupTime(formData: FormData) {
    const user = await requireUser();

    const orderId = Number(formData.get("orderId"));
    const pickupHour = String(formData.get("pickupHour") || "");
    const pickupMinute = String(formData.get("pickupMinute") || "");

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("Invalid order id.");
    }

    if (!pickupHour || !pickupMinute) {
        throw new Error("Pickup hour and minute are required.");
    }

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId: user.id,
        },
        select: {
            serviceDate: true,
            pickupTime: true,
        },
    });

    if (!order) {
        redirect("/account?orderAction=unavailable");
    }

    const pickupDate = order.serviceDate || order.pickupTime;

    if (!pickupDate) {
        throw new Error("Order menu date is missing.");
    }

    const pickupTime = buildLocalDateTimeFromDateKey(
        toDateKey(pickupDate),
        pickupHour,
        pickupMinute
    );

    if (!pickupTime || Number.isNaN(pickupTime.getTime())) {
        throw new Error("Invalid pickup time.");
    }

    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            userId: user.id,
            fulfillmentStatus: {
                notIn: [
                    OrderFulfillmentStatus.COMPLETED,
                    OrderFulfillmentStatus.CANCELLED,
                    OrderFulfillmentStatus.REFUNDED,
                ],
            },
        },
        data: {
            pickupTime,
        },
    });

    if (result.count === 0) {
        redirect("/account?orderAction=unavailable");
    }

    redirect("/account?orderAction=pickup-updated");
}

export async function signOutAccount() {
    await signOut({
        redirectTo: "/menu",
    });
}
