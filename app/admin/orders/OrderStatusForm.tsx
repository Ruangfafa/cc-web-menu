"use client";

import { useRef } from "react";
import { useLanguage } from "../../LanguageProvider";
import { updateOrderStatus } from "./actions";

const paymentStatuses = ["PENDING_PAYMENT", "PAID"] as const;
const fulfillmentStatuses = [
    "PREPARING",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
] as const;

type PaymentStatus = (typeof paymentStatuses)[number];
type FulfillmentStatus = (typeof fulfillmentStatuses)[number];

type OrderStatusFormProps = {
    orderId: number;
    updatedAt: string;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
};

export function OrderStatusForm({
    orderId,
    updatedAt,
    paymentStatus,
    fulfillmentStatus,
}: OrderStatusFormProps) {
    const { t } = useLanguage();
    const formRef = useRef<HTMLFormElement>(null);
    const statusLabels = {
        PENDING_PAYMENT: t("pendingPayment"),
        PAID: t("paid"),
        PREPARING: t("preparing"),
        COMPLETED: t("completed"),
        CANCELLED: t("cancelled"),
        REFUNDED: t("refunded"),
    } as const;

    return (
        <form
            ref={formRef}
            action={updateOrderStatus}
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
                minWidth: 320,
            }}
        >
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="updatedAt" value={updatedAt} />

            <label htmlFor={`payment-status-${orderId}`}>
                {t("paymentStatus")}
                <select
                    id={`payment-status-${orderId}`}
                    name="paymentStatus"
                    defaultValue={paymentStatus}
                    onChange={() => formRef.current?.requestSubmit()}
                    style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                    }}
                >
                    {paymentStatuses.map((status) => (
                        <option key={status} value={status}>
                            {statusLabels[status]}
                        </option>
                    ))}
                </select>
            </label>

            <label htmlFor={`fulfillment-status-${orderId}`}>
                {t("orderStatus")}
                <select
                    id={`fulfillment-status-${orderId}`}
                    name="fulfillmentStatus"
                    defaultValue={fulfillmentStatus}
                    onChange={() => formRef.current?.requestSubmit()}
                    style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                    }}
                >
                    {fulfillmentStatuses.map((status) => (
                        <option key={status} value={status}>
                            {statusLabels[status]}
                        </option>
                    ))}
                </select>
            </label>
        </form>
    );
}
