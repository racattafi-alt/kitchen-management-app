-- Add piecesPerBox to ingredients: how many individual units are contained in one sales box.
-- Used when isSoldByPackage=true to correctly calculate order quantities.

ALTER TABLE `ingredients` ADD COLUMN `piecesPerBox` int DEFAULT NULL;
