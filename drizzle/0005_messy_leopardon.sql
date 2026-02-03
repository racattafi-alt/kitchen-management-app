ALTER TABLE `ingredients` MODIFY COLUMN `supplier` varchar(255);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `supplierId` varchar(36);