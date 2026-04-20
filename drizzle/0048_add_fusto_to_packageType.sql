-- Add 'Fusto' to ingredients.packageType enum (already in Drizzle schema but missing from DB)
ALTER TABLE `ingredients` MODIFY COLUMN `packageType` enum('Sacco','Busta','Brick','Cartone','Scatola','Bottiglia','Barattolo','Lattina','Sfuso','Fusto');
