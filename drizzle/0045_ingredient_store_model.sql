-- Migration 0045: Refactor ingredients/suppliers to global model
-- Idempotent — safe to re-run. Uses MySQL 8.0.29+ IF NOT EXISTS / IF EXISTS syntax.

-- STEP 1: Crea tabella junction ingredient_stores
CREATE TABLE IF NOT EXISTS `ingredient_stores` (
  `ingredientId` varchar(36) NOT NULL,
  `storeId` varchar(36) NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ingredientId`, `storeId`)
);
--> statement-breakpoint
-- STEP 2: Copia i dati storeId esistenti in ingredient_stores (INSERT IGNORE = idempotente)
INSERT IGNORE INTO `ingredient_stores` (`ingredientId`, `storeId`, `isActive`, `createdAt`, `updatedAt`)
SELECT `id`, `storeId`, `isActive`, `createdAt`, NOW()
FROM `ingredients`
WHERE `storeId` IS NOT NULL AND `storeId` != '';
--> statement-breakpoint
-- STEP 3: Rimuovi storeId da ingredients (IF EXISTS = idempotente)
ALTER TABLE `ingredients` DROP COLUMN IF EXISTS `storeId`;
--> statement-breakpoint
-- STEP 4: Aggiungi vincolo univoco su ingredients(name, supplierId) se mancante
ALTER TABLE `ingredients` ADD UNIQUE KEY IF NOT EXISTS `ingredients_name_supplierId_unique` (`name`, `supplierId`);
--> statement-breakpoint
-- STEP 5: Rimuovi indice storeId da suppliers se presente
ALTER TABLE `suppliers` DROP INDEX IF EXISTS `suppliers_name_storeId_unique`;
--> statement-breakpoint
-- STEP 6: Rimuovi storeId da suppliers (IF EXISTS = idempotente)
ALTER TABLE `suppliers` DROP COLUMN IF EXISTS `storeId`;
--> statement-breakpoint
-- STEP 7: Aggiungi vincolo univoco su suppliers(name) se mancante
ALTER TABLE `suppliers` ADD UNIQUE KEY IF NOT EXISTS `suppliers_name_unique` (`name`);
