import { auth } from "@/auth";
import { toDateKey } from "@/lib/menu-date";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { buildOrderFilters } from "../filters";

function formatCents(cents: number) {
    return (cents / 100).toFixed(2);
}

function csvCell(value: unknown) {
    const text =
        value instanceof Date
            ? value.toLocaleString()
            : value === null || value === undefined
              ? ""
              : String(value);

    return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const { where } = buildOrderFilters({
        dateFrom: url.searchParams.get("dateFrom") || undefined,
        dateTo: url.searchParams.get("dateTo") || undefined,
        paymentStatus: url.searchParams.getAll("paymentStatus"),
        fulfillmentStatus: url.searchParams.getAll("fulfillmentStatus"),
    });
    const orders = await prisma.order.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
            user: true,
            items: {
                include: {
                    options: true,
                },
            },
        },
    });
    const rows = [
        [
            "Order ID",
            "Created At",
            "Menu Date",
            "Pickup Time",
            "Customer",
            "Email",
            "Phone",
            "Address",
            "Payment Status",
            "Order Status",
            "Subtotal",
            "Tax",
            "Delivery Fee",
            "Total",
            "Items",
            "Comment",
        ],
        ...orders.map((order) => [
            order.id,
            order.createdAt,
            order.serviceDate ? toDateKey(order.serviceDate) : "",
            order.pickupTime || "",
            order.user?.name || order.guestName || "",
            order.user?.email || "",
            order.user?.phone || order.guestPhone || "",
            order.guestAddress || "",
            order.paymentStatus,
            order.fulfillmentStatus,
            formatCents(order.subtotalCents),
            formatCents(order.taxCents),
            formatCents(order.deliveryFeeCents),
            formatCents(order.totalCents),
            order.items
                .map((item) => {
                    const options = item.options
                        .map(
                            (option) =>
                                `${option.optionGroupNameSnapshot}: ${option.subItemNameSnapshot}`
                        )
                        .join("; ");

                    return `${item.nameSnapshot} x ${item.quantity}${
                        options ? ` (${options})` : ""
                    }`;
                })
                .join(" | "),
            order.comment || "",
        ]),
    ];
    const csv = `\uFEFF${rows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n")}`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="orders-${toDateKey(
                new Date()
            )}.csv"`,
        },
    });
}
