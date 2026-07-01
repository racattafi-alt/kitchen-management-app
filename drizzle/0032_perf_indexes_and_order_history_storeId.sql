-- Add storeId to order_history (was missing from original migration)
ALTER TABLE `order_history` ADD `storeId` varchar(36) NOT NULL DEFAULT 'default-store-001';
--> statement-breakpoint
-- Indexes for order_history (used by getUserOrderHistory and getAllOrderHistory)
CREATE INDEX `idx_order_history_storeId_createdAt` ON `order_history` (`storeId`, `createdAt`);
--> statement-breakpoint
CREATE INDEX `idx_order_history_userId_storeId` ON `order_history` (`userId`, `storeId`);
--> statement-breakpoint
-- Indexes for orders (used by getOrders with storeId + orderDate sort)
CREATE INDEX `idx_orders_storeId_orderDate` ON `orders` (`storeId`, `orderDate`);
--> statement-breakpoint
CREATE INDEX `idx_orders_weekId` ON `orders` (`weekId`);
--> statement-breakpoint
-- Index for order_items (used by getOrderItems with orderId lookup)
CREATE INDEX `idx_order_items_orderId` ON `order_items` (`orderId`);
