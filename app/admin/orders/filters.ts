import { parseDateKey } from "@/lib/menu-date";
import {
    OrderFulfillmentStatus,
    OrderPaymentStatus,
    Prisma,
} from "@prisma/client";

export const paymentStatusOptions = [
    OrderPaymentStatus.PENDING_PAYMENT,
    OrderPaymentStatus.PAID,
] as const;

export const fulfillmentStatusOptions = [
    OrderFulfillmentStatus.PREPARING,
    OrderFulfillmentStatus.COMPLETED,
    OrderFulfillmentStatus.CANCELLED,
    OrderFulfillmentStatus.REFUNDED,
] as const;

export type OrderFilterParams = {
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: string | string[];
    fulfillmentStatus?: string | string[];
};

export function normalizeSearchParamArray(value: string | string[] | undefined) {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

export function buildOrderFilters(params: OrderFilterParams) {
    const selectedPaymentStatuses = normalizeSearchParamArray(
        params.paymentStatus
    ).filter((status): status is OrderPaymentStatus =>
        paymentStatusOptions.includes(status as OrderPaymentStatus)
    );
    const selectedFulfillmentStatuses = normalizeSearchParamArray(
        params.fulfillmentStatus
    ).filter((status): status is OrderFulfillmentStatus =>
        fulfillmentStatusOptions.includes(status as OrderFulfillmentStatus)
    );
    const selectedDateFrom = params.dateFrom
        ? parseDateKey(params.dateFrom)
        : null;
    const selectedDateTo = params.dateTo ? parseDateKey(params.dateTo) : null;
    const where: Prisma.OrderWhereInput = {};

    if (selectedDateFrom || selectedDateTo) {
        where.serviceDate = {};

        if (selectedDateFrom) {
            where.serviceDate.gte = selectedDateFrom;
        }

        if (selectedDateTo) {
            where.serviceDate.lte = selectedDateTo;
        }
    }

    if (selectedPaymentStatuses.length > 0) {
        where.paymentStatus = {
            in: selectedPaymentStatuses,
        };
    }

    if (selectedFulfillmentStatuses.length > 0) {
        where.fulfillmentStatus = {
            in: selectedFulfillmentStatuses,
        };
    }

    return {
        where,
        selectedPaymentStatuses,
        selectedFulfillmentStatuses,
        selectedDateFrom,
        selectedDateTo,
    };
}
