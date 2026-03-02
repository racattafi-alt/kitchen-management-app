-- Add isGlobal flag to stores table.
-- When working in a global store, write operations propagate to ALL active stores.
ALTER TABLE `stores` ADD COLUMN `isGlobal` boolean NOT NULL DEFAULT false;
