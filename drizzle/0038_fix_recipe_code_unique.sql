-- Fix code global unique on final_recipes and semi_finished_recipes
-- Same issue as suppliers: code must be unique per-store, not globally
-- This allows the same recipe code to exist in multiple stores

-- final_recipes
ALTER TABLE `final_recipes` DROP INDEX `final_recipes_code_unique`;
--> statement-breakpoint
ALTER TABLE `final_recipes` ADD UNIQUE INDEX `final_recipes_code_storeId_unique` (`code`, `storeId`);
--> statement-breakpoint

-- semi_finished_recipes
ALTER TABLE `semi_finished_recipes` DROP INDEX `semi_finished_recipes_code_unique`;
--> statement-breakpoint
ALTER TABLE `semi_finished_recipes` ADD UNIQUE INDEX `semi_finished_recipes_code_storeId_unique` (`code`, `storeId`);
