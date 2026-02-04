ALTER TABLE `final_recipes` ADD `isSemiFinished` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `isSellable` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `sellingPrice` decimal(10,2);