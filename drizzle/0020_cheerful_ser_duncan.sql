ALTER TABLE `final_recipes` MODIFY COLUMN `yieldPercentage` decimal(6,3) NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` MODIFY COLUMN `serviceWastePercentage` decimal(6,3) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `semi_finished_recipes` MODIFY COLUMN `yieldPercentage` decimal(6,3) NOT NULL;