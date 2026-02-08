ALTER TABLE `ingredients` ADD `isSalaItem` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `subcategory` varchar(100);