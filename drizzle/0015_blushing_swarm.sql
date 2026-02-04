ALTER TABLE `weekly_productions` MODIFY COLUMN `productionType` enum('final','semifinished') NOT NULL DEFAULT 'final';--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `measurementType` enum('weight_only','unit_only','both') DEFAULT 'weight_only' NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `pieceWeight` decimal(10,3);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isOrderable` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_productions` ADD `quantity` decimal(10,3) NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_productions` DROP COLUMN `desiredQuantity`;--> statement-breakpoint
ALTER TABLE `weekly_productions` DROP COLUMN `unitType`;--> statement-breakpoint
ALTER TABLE `weekly_productions` DROP COLUMN `currentStock`;--> statement-breakpoint
ALTER TABLE `weekly_productions` DROP COLUMN `status`;