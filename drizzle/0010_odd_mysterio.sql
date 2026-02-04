ALTER TABLE `final_recipes` ADD `finalWeight` decimal(10,3);--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `producedQuantity` decimal(10,3);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isFood` boolean DEFAULT true NOT NULL;