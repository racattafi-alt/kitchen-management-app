-- Fix suppliers_name_unique: drop global unique on name, add composite unique (name, storeId)
-- This allows the same supplier name to exist in multiple stores (required for multi-store migration)
ALTER TABLE `suppliers` DROP INDEX `suppliers_name_unique`;
--> statement-breakpoint
ALTER TABLE `suppliers` ADD UNIQUE INDEX `suppliers_name_storeId_unique` (`name`, `storeId`);
