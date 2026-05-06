ALTER TABLE `menu_items`
    ADD COLUMN `available_date` DATE NULL;

UPDATE `menu_items`
SET `available_date` = CURRENT_DATE
WHERE `available_date` IS NULL;

ALTER TABLE `menu_items`
    MODIFY COLUMN `available_date` DATE NOT NULL;

ALTER TABLE `orders`
    ADD COLUMN `service_date` DATE NULL;

CREATE INDEX `menu_items_available_date_idx` ON `menu_items` (`available_date`);

CREATE INDEX `orders_service_date_idx` ON `orders` (`service_date`);
