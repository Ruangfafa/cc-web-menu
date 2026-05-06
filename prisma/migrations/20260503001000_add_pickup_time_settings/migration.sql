ALTER TABLE `delivery_settings`
    ADD COLUMN `require_pickup_time` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `orders`
    ADD COLUMN `pickup_time` DATETIME(3) NULL;
