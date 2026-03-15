CREATE TABLE `shopping_list_sessions` (
	`userId` int NOT NULL,
	`orderQuantities` json NOT NULL DEFAULT ('{}'),
	`orderPackages` json NOT NULL DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_list_sessions_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `shopping_list_sessions` ADD CONSTRAINT `shopping_list_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
