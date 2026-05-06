ALTER TABLE `orders`
    ADD COLUMN `payment_status` ENUM('PENDING_PAYMENT', 'PAID') NOT NULL DEFAULT 'PENDING_PAYMENT',
    ADD COLUMN `fulfillment_status` ENUM('PREPARING', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PREPARING',
    ADD COLUMN `comment` TEXT NULL;

UPDATE `orders`
SET
    `payment_status` = CASE
        WHEN `status` = 'PENDING_PAYMENT' THEN 'PENDING_PAYMENT'
        ELSE 'PAID'
    END,
    `fulfillment_status` = CASE
        WHEN `status` IN ('CANCELLED', 'REFUNDED') THEN `status`
        WHEN `status` = 'COMPLETED' THEN 'COMPLETED'
        ELSE 'PREPARING'
    END;
