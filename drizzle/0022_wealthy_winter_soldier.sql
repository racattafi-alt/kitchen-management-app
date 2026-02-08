CREATE TABLE `order_history` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`orderData` json NOT NULL,
	`pdfUrl` text,
	`totalItems` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_order_sessions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`ingredientId` varchar(36) NOT NULL,
	`quantity` decimal(10,3) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_order_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `order_history` ADD CONSTRAINT `order_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_order_sessions` ADD CONSTRAINT `user_order_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_order_sessions` ADD CONSTRAINT `user_order_sessions_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE cascade ON UPDATE no action;