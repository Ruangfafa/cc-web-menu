import { auth } from "@/auth";
import type { CartItem } from "@/lib/cart";
import {
    parseDateKey,
    todayDateKey,
    toDateKey,
    toLocalDateKey,
} from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { DeliveryAddressMode } from "@prisma/client";
import { NextResponse } from "next/server";

type CheckoutRequestBody = {
    cartItems?: CartItem[];
    selectedAddressId?: number | null;
    deliveryMode?: DeliveryAddressMode;
    guestName?: string;
    guestPhone?: string;
    guestAddress?: string;
    pickupTime?: string | null;
};

type SelectedOptionForOrder = {
    optionGroupNameSnapshot: string;
    subItemNameSnapshot: string;
    priceCentsSnapshot: number;
};

type OrderItemForCreate = {
    menuItemId: number;
    mainItemId: number;
    nameSnapshot: string;
    basePriceCentsSnapshot: number;
    quantity: number;
    totalCentsSnapshot: number;
    options: SelectedOptionForOrder[];
};

/**
 * 结账下单 API
 *
 * 路径：
 * POST /api/checkout
 *
 * 功能：
 * 1. 接收前端购物车快照和顾客信息
 * 2. 后端重新查询 menu_item / option_group_item
 * 3. 后端重新校验必选规则和价格
 * 4. 创建 Order / OrderItem / OrderItemOption
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        const body = (await request.json()) as CheckoutRequestBody;
        const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
        const deliverySetting = await prisma.deliverySetting.findUnique({
            where: {
                id: 1,
            },
        });
        const deliveryMode =
            deliverySetting?.mode || DeliveryAddressMode.SELF_ADDRESS;
        const requirePickupTime = deliverySetting?.requirePickupTime || false;
        const pickupTimeValue = body.pickupTime
            ? new Date(body.pickupTime)
            : null;

        if (requirePickupTime && !pickupTimeValue) {
            return NextResponse.json(
                { error: "Pickup time is required." },
                { status: 400 }
            );
        }

        if (pickupTimeValue && Number.isNaN(pickupTimeValue.getTime())) {
            return NextResponse.json(
                { error: "Invalid pickup time." },
                { status: 400 }
            );
        }

        if (cartItems.length === 0) {
            return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
        }

        const cartServiceDates = [
            ...new Set(cartItems.map((item) => item.serviceDate).filter(Boolean)),
        ];

        if (
            cartServiceDates.length !== 1 ||
            cartItems.some((item) => item.serviceDate !== cartServiceDates[0])
        ) {
            return NextResponse.json(
                { error: "One order can only contain menu items for one day." },
                { status: 400 }
            );
        }

        const serviceDateKey = cartServiceDates[0] || "";
        const serviceDate = parseDateKey(serviceDateKey);
        const todayKey = todayDateKey();

        if (!serviceDate || serviceDateKey < todayKey) {
            return NextResponse.json(
                { error: "Invalid menu date in cart." },
                { status: 400 }
            );
        }

        if (
            pickupTimeValue &&
            toLocalDateKey(pickupTimeValue) !== serviceDateKey
        ) {
            return NextResponse.json(
                { error: "Pickup time must be on the selected menu date." },
                { status: 400 }
            );
        }

        const uniqueMenuItemIds = [...new Set(cartItems.map((item) => item.menuItemId))];

        const menuItems = await prisma.menuItem.findMany({
            where: {
                id: { in: uniqueMenuItemIds },
                isActive: true,
                mainItem: {
                    isAvailable: true,
                },
            },
            include: {
                mainItem: true,
                optionGroups: {
                    include: {
                        optionGroup: {
                            include: {
                                options: {
                                    where: {
                                        isAvailable: true,
                                    },
                                    include: {
                                        subItem: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

        const orderItems: OrderItemForCreate[] = [];
        let subtotalCents = 0;

        for (const cartItem of cartItems) {
            if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
                return NextResponse.json(
                    { error: "Invalid cart item quantity." },
                    { status: 400 }
                );
            }

            const menuItem = menuItemMap.get(cartItem.menuItemId);

            if (!menuItem) {
                return NextResponse.json(
                    {
                        error: `Menu item ${cartItem.menuItemId} is unavailable.`,
                    },
                    { status: 400 }
                );
            }

            if (toDateKey(menuItem.availableDate) !== serviceDateKey) {
                return NextResponse.json(
                    {
                        error: `Menu item ${cartItem.menuItemId} is not available for ${serviceDateKey}.`,
                    },
                    { status: 400 }
                );
            }

            const displayName = menuItem.displayName || menuItem.mainItem.name;
            const selectedOptionsByGroup = new Map<number, SelectedOptionForOrder[]>();

            for (const selectedOption of cartItem.selectedOptions) {
                const menuItemGroup = menuItem.optionGroups.find(
                    (relation) =>
                        relation.optionGroup.id === selectedOption.optionGroupId
                );

                if (!menuItemGroup) {
                    return NextResponse.json(
                        { error: `Invalid option group on ${displayName}.` },
                        { status: 400 }
                    );
                }

                const option = menuItemGroup.optionGroup.options.find(
                    (groupOption) =>
                        groupOption.id === selectedOption.optionGroupItemId
                );

                if (!option) {
                    return NextResponse.json(
                        { error: `Invalid option selection on ${displayName}.` },
                        { status: 400 }
                    );
                }

                const currentOptions =
                    selectedOptionsByGroup.get(menuItemGroup.optionGroup.id) || [];

                currentOptions.push({
                    optionGroupNameSnapshot: menuItemGroup.optionGroup.name,
                    subItemNameSnapshot: option.subItem.name,
                    priceCentsSnapshot: option.priceCents,
                });

                selectedOptionsByGroup.set(menuItemGroup.optionGroup.id, currentOptions);
            }

            for (const relation of menuItem.optionGroups) {
                const group = relation.optionGroup;
                const selectedCount =
                    selectedOptionsByGroup.get(group.id)?.length || 0;

                if (selectedCount < group.minSelect || selectedCount > group.maxSelect) {
                    return NextResponse.json(
                        {
                            error: `Selection rule failed for ${displayName} / ${group.name}.`,
                        },
                        { status: 400 }
                    );
                }
            }

            const flattenedSelectedOptions = [...selectedOptionsByGroup.values()].flat();
            const unitTotalCents =
                menuItem.mainItem.priceCents +
                flattenedSelectedOptions.reduce(
                    (sum, option) => sum + option.priceCentsSnapshot,
                    0
                );
            const lineTotalCents = unitTotalCents * cartItem.quantity;

            subtotalCents += lineTotalCents;

            orderItems.push({
                menuItemId: menuItem.id,
                mainItemId: menuItem.mainItem.id,
                nameSnapshot: displayName,
                basePriceCentsSnapshot: menuItem.mainItem.priceCents,
                quantity: cartItem.quantity,
                totalCentsSnapshot: lineTotalCents,
                options: flattenedSelectedOptions,
            });
        }

        let userId: number | null = null;
        let guestName: string | null = null;
        let guestPhone: string | null = null;
        let guestAddress: string | null = null;
        const selectedAddressId = body.selectedAddressId
            ? Number(body.selectedAddressId)
            : null;

        if (
            deliveryMode === DeliveryAddressMode.SITE_ADDRESS &&
            !selectedAddressId
        ) {
            return NextResponse.json(
                { error: "Please select a site address." },
                { status: 400 }
            );
        }

        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: {
                    email: session.user.email,
                },
                include: {
                    addresses: true,
                },
            });

            if (!user) {
                return NextResponse.json(
                    { error: "Logged-in user not found." },
                    { status: 400 }
                );
            }

            userId = user.id;

            guestName = user.name;
            guestPhone = user.phone;

            if (deliveryMode === DeliveryAddressMode.SELF_ADDRESS) {
                if (!selectedAddressId) {
                    return NextResponse.json(
                        { error: "Please select a delivery address." },
                        { status: 400 }
                    );
                }

                const selectedAddress = user.addresses.find(
                    (address) => address.id === selectedAddressId
                );

                if (!selectedAddress) {
                    return NextResponse.json(
                        {
                            error: "Selected address does not belong to current user.",
                        },
                        { status: 400 }
                    );
                }

                guestAddress = selectedAddress.fullAddress;
            } else {
                const siteAddress = await prisma.siteAddress.findFirst({
                    where: {
                        id: selectedAddressId || 0,
                        isActive: true,
                    },
                });

                if (!siteAddress) {
                    return NextResponse.json(
                        { error: "Selected site address is unavailable." },
                        { status: 400 }
                    );
                }

                guestAddress = siteAddress.fullAddress;
            }
        } else {
            guestName = String(body.guestName || "").trim();
            guestPhone = String(body.guestPhone || "").trim();
            guestAddress =
                deliveryMode === DeliveryAddressMode.SELF_ADDRESS
                    ? String(body.guestAddress || "").trim()
                    : null;

            if (
                !guestName ||
                !guestPhone ||
                (deliveryMode === DeliveryAddressMode.SELF_ADDRESS &&
                    !guestAddress)
            ) {
                return NextResponse.json(
                    {
                        error: "Guest name, phone, and address are required.",
                    },
                    { status: 400 }
                );
            }

            if (deliveryMode === DeliveryAddressMode.SITE_ADDRESS) {
                const siteAddress = await prisma.siteAddress.findFirst({
                    where: {
                        id: selectedAddressId || 0,
                        isActive: true,
                    },
                });

                if (!siteAddress) {
                    return NextResponse.json(
                        { error: "Selected site address is unavailable." },
                        { status: 400 }
                    );
                }

                guestAddress = siteAddress.fullAddress;
            }
        }

        const taxCents = 0;
        const deliveryFeeCents = 0;
        const totalCents = subtotalCents + taxCents + deliveryFeeCents;

        const order = await prisma.order.create({
            data: {
                userId,
                guestName,
                guestPhone,
                guestAddress,
                serviceDate,
                pickupTime: pickupTimeValue,
                subtotalCents,
                taxCents,
                deliveryFeeCents,
                totalCents,
                items: {
                    create: orderItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        mainItemId: item.mainItemId,
                        nameSnapshot: item.nameSnapshot,
                        basePriceCentsSnapshot: item.basePriceCentsSnapshot,
                        quantity: item.quantity,
                        totalCentsSnapshot: item.totalCentsSnapshot,
                        options: {
                            create: item.options,
                        },
                    })),
                },
            },
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
        });
    } catch (error) {
        console.error("Checkout API error:", error);

        return NextResponse.json(
            {
                error: "Failed to create order.",
            },
            {
                status: 500,
            }
        );
    }
}
