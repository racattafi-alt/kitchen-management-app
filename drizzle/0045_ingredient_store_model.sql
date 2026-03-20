-- Migration 0045: Refactor ingredients and suppliers to global model
--
-- Changes:
--   1. suppliers → database globale (rimuovi storeId, vincolo univoco su name)
--   2. ingredients → entità globale (rimuovi storeId, vincolo univoco su name+supplierId)
--   3. ingredient_stores → nuova tabella di giunzione (ingredientId, storeId, isActive)
--
-- Logica di migrazione dati:
--   - Ogni riga ingredients esistente (che ha storeId) viene spostata in ingredient_stores
--   - Ingredienti duplicati (stesso name+supplierId in store diversi) vengono deduplicati:
--     si tiene il record con id minore come canonico, si aggiornano i riferimenti
--   - Fornitori duplicati (stesso name in store diversi) vengono deduplicati analogamente

-- ============================================================
-- STEP 1: Crea tabella junction ingredient_stores
-- ============================================================
CREATE TABLE `ingredient_stores` (
  `ingredientId` varchar(36) NOT NULL,
  `storeId` varchar(36) NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ingredientId`, `storeId`)
);

-- ============================================================
-- STEP 2: Popola ingredient_stores dai dati esistenti
-- ============================================================
INSERT INTO `ingredient_stores` (`ingredientId`, `storeId`, `isActive`, `createdAt`, `updatedAt`)
SELECT `id`, `storeId`, `isActive`, `createdAt`, NOW()
FROM `ingredients`
WHERE `storeId` IS NOT NULL AND `storeId` != '';

-- ============================================================
-- STEP 3: Deduplica ingredienti per (name, COALESCE(supplierId,''))
--         Mantieni il record con id minore come canonico.
--         Aggiorna ingredient_stores e riferimenti nelle ricette.
-- ============================================================

-- Tabella temporanea con id canonici
CREATE TEMPORARY TABLE `_canonical_ingredients` AS
SELECT
  `name`,
  COALESCE(`supplierId`, '') AS `supplierKey`,
  MIN(`id`) AS `canonicalId`
FROM `ingredients`
GROUP BY `name`, COALESCE(`supplierId`, '');

-- Aggiorna ingredient_stores: redirige duplicati verso l'id canonico
-- (ON DUPLICATE KEY: se esiste già la coppia (canonicalId, storeId), ignora)
INSERT INTO `ingredient_stores` (`ingredientId`, `storeId`, `isActive`, `createdAt`, `updatedAt`)
SELECT ci.`canonicalId`, igs.`storeId`, igs.`isActive`, igs.`createdAt`, igs.`updatedAt`
FROM `ingredient_stores` igs
JOIN `ingredients` i ON igs.`ingredientId` = i.`id`
JOIN `_canonical_ingredients` ci
  ON i.`name` = ci.`name`
  AND COALESCE(i.`supplierId`, '') = ci.`supplierKey`
WHERE igs.`ingredientId` != ci.`canonicalId`
ON DUPLICATE KEY UPDATE `isActive` = VALUES(`isActive`);

-- Rimuovi le righe junction che puntano a duplicati (non canonici)
DELETE igs FROM `ingredient_stores` igs
JOIN `ingredients` i ON igs.`ingredientId` = i.`id`
JOIN `_canonical_ingredients` ci
  ON i.`name` = ci.`name`
  AND COALESCE(i.`supplierId`, '') = ci.`supplierKey`
WHERE igs.`ingredientId` != ci.`canonicalId`;

-- Aggiorna user_order_sessions per puntare agli id canonici
UPDATE `user_order_sessions` uos
JOIN `ingredients` i ON uos.`ingredientId` = i.`id`
JOIN `_canonical_ingredients` ci
  ON i.`name` = ci.`name`
  AND COALESCE(i.`supplierId`, '') = ci.`supplierKey`
SET uos.`ingredientId` = ci.`canonicalId`
WHERE uos.`ingredientId` != ci.`canonicalId`;

-- Elimina gli ingredienti duplicati (non canonici)
DELETE i FROM `ingredients` i
JOIN `_canonical_ingredients` ci
  ON i.`name` = ci.`name`
  AND COALESCE(i.`supplierId`, '') = ci.`supplierKey`
WHERE i.`id` != ci.`canonicalId`;

DROP TEMPORARY TABLE `_canonical_ingredients`;

-- ============================================================
-- STEP 4: Rimuovi storeId da ingredients, aggiungi vincolo univoco
-- ============================================================
ALTER TABLE `ingredients`
  DROP COLUMN `storeId`;

ALTER TABLE `ingredients`
  ADD UNIQUE KEY `ingredients_name_supplierId_unique` (`name`, `supplierId`);

-- ============================================================
-- STEP 5: Deduplica suppliers per name (mantieni id minore)
-- ============================================================

-- Aggiorna FK negli ingredienti prima di eliminare duplicati fornitori
CREATE TEMPORARY TABLE `_canonical_suppliers` AS
SELECT `name`, MIN(`id`) AS `canonicalId`
FROM `suppliers`
GROUP BY `name`;

UPDATE `ingredients` i
JOIN `suppliers` s ON i.`supplierId` = s.`id`
JOIN `_canonical_suppliers` cs ON s.`name` = cs.`name`
SET i.`supplierId` = cs.`canonicalId`
WHERE i.`supplierId` != cs.`canonicalId`;

DELETE s FROM `suppliers` s
JOIN `_canonical_suppliers` cs ON s.`name` = cs.`name`
WHERE s.`id` != cs.`canonicalId`;

DROP TEMPORARY TABLE `_canonical_suppliers`;

-- ============================================================
-- STEP 6: Rimuovi storeId da suppliers, aggiungi vincolo univoco globale
-- ============================================================
ALTER TABLE `suppliers`
  DROP INDEX `suppliers_name_storeId_unique`,
  DROP COLUMN `storeId`;

ALTER TABLE `suppliers`
  ADD UNIQUE KEY `suppliers_name_unique` (`name`);
