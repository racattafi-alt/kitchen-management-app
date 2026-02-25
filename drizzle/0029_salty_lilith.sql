CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`storeId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` varchar(36),
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cloud_storage` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `food_matrix` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `haccp` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_types` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `production_batches` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `semi_finished_recipes` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `waste_records` ADD `storeId` varchar(36) NOT NULL;