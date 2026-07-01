-- Add isSoldByPackage boolean to ingredients
-- Indicates that this ingredient must be ordered/counted in whole packages
ALTER TABLE `ingredients` ADD COLUMN `isSoldByPackage` boolean NOT NULL DEFAULT false;
