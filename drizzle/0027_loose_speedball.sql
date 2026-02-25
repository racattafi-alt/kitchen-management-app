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
CREATE TABLE `storeUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storeId` varchar(36) NOT NULL,
	`role` enum('admin','manager','user') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storeUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`email` varchar(320),
	`settings` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cloud_storage` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `food_matrix` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `haccp` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_types` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `production_batches` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `semi_finished_recipes` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredStoreId` varchar(36);--> statement-breakpoint
ALTER TABLE `waste_records` ADD `storeId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_productions` ADD `storeId` varchar(36) NOT NULL;