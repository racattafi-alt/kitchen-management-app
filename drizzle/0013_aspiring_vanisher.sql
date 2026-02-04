CREATE TABLE `recipe_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipe_id` varchar(36) NOT NULL,
	`recipe_type` enum('final','semifinished') NOT NULL,
	`version_number` int NOT NULL,
	`snapshot` json NOT NULL,
	`changed_by` varchar(64) NOT NULL,
	`change_description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `is_food` boolean DEFAULT true NOT NULL;