-- Migration 0046: Soluzione D — Normalizzazione componenti ricette
-- Crea tabelle relazionali per i componenti al posto dei JSON blob
-- I JSON blob esistenti vengono mantenuti per sicurezza (drop in migrazione futura)

CREATE TABLE `recipe_components` (
  `id` varchar(36) NOT NULL,
  `recipeId` varchar(36) NOT NULL,
  `ingredientId` varchar(36) NULL,
  `semiFinishedId` varchar(36) NULL,
  `operationId` varchar(36) NULL,
  `componentName` varchar(255) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unitSnapshot` varchar(20) NULL,
  `priceSnapshot` decimal(10,4) NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  CONSTRAINT `recipe_components_pk` PRIMARY KEY (`id`),
  CONSTRAINT `recipe_components_recipeId_fk`
    FOREIGN KEY (`recipeId`) REFERENCES `final_recipes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `recipe_components_ingredientId_fk`
    FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `recipe_components_semiFinishedId_fk`
    FOREIGN KEY (`semiFinishedId`) REFERENCES `semi_finished_recipes`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `recipe_components_operationId_fk`
    FOREIGN KEY (`operationId`) REFERENCES `operations`(`id`) ON DELETE RESTRICT
);

CREATE INDEX `rc_recipeId_idx` ON `recipe_components` (`recipeId`);
CREATE INDEX `rc_ingredientId_idx` ON `recipe_components` (`ingredientId`);
CREATE INDEX `rc_semiFinishedId_idx` ON `recipe_components` (`semiFinishedId`);

CREATE TABLE `semi_finished_components` (
  `id` varchar(36) NOT NULL,
  `semiFinishedRecipeId` varchar(36) NOT NULL,
  `ingredientId` varchar(36) NULL,
  `childSemiFinishedId` varchar(36) NULL,
  `operationId` varchar(36) NULL,
  `componentName` varchar(255) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unitSnapshot` varchar(20) NULL,
  `priceSnapshot` decimal(10,4) NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  CONSTRAINT `semi_finished_components_pk` PRIMARY KEY (`id`),
  CONSTRAINT `semi_finished_components_parentId_fk`
    FOREIGN KEY (`semiFinishedRecipeId`) REFERENCES `semi_finished_recipes`(`id`) ON DELETE CASCADE,
  CONSTRAINT `semi_finished_components_ingredientId_fk`
    FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `semi_finished_components_childId_fk`
    FOREIGN KEY (`childSemiFinishedId`) REFERENCES `semi_finished_recipes`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `semi_finished_components_operationId_fk`
    FOREIGN KEY (`operationId`) REFERENCES `operations`(`id`) ON DELETE RESTRICT
);

CREATE INDEX `sfc_semiFinishedRecipeId_idx` ON `semi_finished_components` (`semiFinishedRecipeId`);
CREATE INDEX `sfc_ingredientId_idx` ON `semi_finished_components` (`ingredientId`);
CREATE INDEX `sfc_childSemiFinishedId_idx` ON `semi_finished_components` (`childSemiFinishedId`);
