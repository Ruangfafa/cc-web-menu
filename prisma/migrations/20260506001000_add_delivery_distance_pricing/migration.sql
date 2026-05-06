ALTER TABLE `delivery_settings`
    ADD COLUMN `origin_address` VARCHAR(255) NULL,
    ADD COLUMN `origin_google_place_id` VARCHAR(255) NULL,
    ADD COLUMN `origin_latitude` DOUBLE NULL,
    ADD COLUMN `origin_longitude` DOUBLE NULL,
    ADD COLUMN `pricing_mode` ENUM('BASE_PLUS_DISTANCE', 'DISTANCE_TIERS') NOT NULL DEFAULT 'BASE_PLUS_DISTANCE',
    ADD COLUMN `base_delivery_fee_cents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `per_km_delivery_fee_cents` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `delivery_distance_tiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_setting_id` INTEGER NOT NULL,
    `min_km` DOUBLE NOT NULL,
    `max_km` DOUBLE NULL,
    `fee_cents` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `delivery_distance_tiers_delivery_setting_id_idx`(`delivery_setting_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `delivery_distance_tiers`
    ADD CONSTRAINT `delivery_distance_tiers_delivery_setting_id_fkey`
    FOREIGN KEY (`delivery_setting_id`) REFERENCES `delivery_settings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
