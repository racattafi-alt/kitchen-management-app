ALTER TABLE `final_recipes` ADD `unitType` enum('u','k') DEFAULT 'k' NOT NULL;--> statement-breakpoint
ALTER TABLE `final_recipes` ADD `unitWeight` decimal(10,3);