ALTER TABLE `final_recipes` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_productions` ADD `storeId` varchar(36) NOT NULL;