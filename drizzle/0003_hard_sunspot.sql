ALTER TABLE `weekly_productions` MODIFY COLUMN `recipeFinalId` varchar(36);--> statement-breakpoint
ALTER TABLE `weekly_productions` ADD `productionType` enum('FINAL_RECIPE','SEMI_FINISHED') DEFAULT 'FINAL_RECIPE' NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_productions` ADD `semiFinishedId` varchar(36);