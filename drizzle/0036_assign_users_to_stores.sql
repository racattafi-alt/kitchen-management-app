-- Assign all existing users to default-store-001 as admin
-- INSERT IGNORE avoids duplicate key errors if some users were already assigned
INSERT IGNORE INTO `storeUsers` (`userId`, `storeId`, `role`, `createdAt`)
SELECT `id`, 'default-store-001', 'admin', NOW() FROM `users`;
--> statement-breakpoint
-- Set preferredStoreId for users who don't have it set yet
UPDATE `users` SET `preferredStoreId` = 'default-store-001'
WHERE `preferredStoreId` IS NULL OR `preferredStoreId` = '';
