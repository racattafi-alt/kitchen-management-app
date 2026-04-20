-- Add piecesPerBox to ingredients: how many individual units are contained in one sales box.
-- Used when isSoldByPackage=true to correctly calculate order quantities.
-- IF NOT EXISTS = idempotente (MySQL 8.0.29+)

ALTER TABLE `ingredients` ADD COLUMN IF NOT EXISTS `piecesPerBox` int DEFAULT NULL;
