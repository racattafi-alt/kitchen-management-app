CREATE TABLE `fridge_temperature_logs` (
	`id` varchar(36) NOT NULL,
	`fridgeId` varchar(36) NOT NULL,
	`date` datetime NOT NULL,
	`temperature` decimal(4,1) NOT NULL,
	`userId` int NOT NULL,
	`isOutOfRange` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fridge_temperature_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fridges` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('fridge','freezer') NOT NULL,
	`location` enum('kitchen','sala') NOT NULL,
	`category` varchar(100),
	`minTemp` decimal(4,1) NOT NULL,
	`maxTemp` decimal(4,1) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fridges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `haccp_production_checks` (
	`id` varchar(36) NOT NULL,
	`haccpSheetId` varchar(36) NOT NULL,
	`productionId` varchar(36) NOT NULL,
	`recipeName` varchar(255) NOT NULL,
	`quantityProduced` decimal(10,3) NOT NULL,
	`chillTemp4C` boolean DEFAULT false,
	`chillTempMinus20C` boolean DEFAULT false,
	`cookingTempOk` boolean DEFAULT false,
	`isCompliant` boolean NOT NULL DEFAULT true,
	`nonComplianceReason` text,
	`correctiveAction` text,
	`checkedBy` int,
	`checkedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `haccp_production_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `haccp_weekly_sheets` (
	`id` varchar(36) NOT NULL,
	`weekStartDate` datetime NOT NULL,
	`weekEndDate` datetime NOT NULL,
	`status` enum('draft','completed','approved') NOT NULL DEFAULT 'draft',
	`completedBy` int,
	`completedAt` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `haccp_weekly_sheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fridge_temperature_logs` ADD CONSTRAINT `fridge_temperature_logs_fridgeId_fridges_id_fk` FOREIGN KEY (`fridgeId`) REFERENCES `fridges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fridge_temperature_logs` ADD CONSTRAINT `fridge_temperature_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haccp_production_checks` ADD CONSTRAINT `haccp_production_checks_haccpSheetId_haccp_weekly_sheets_id_fk` FOREIGN KEY (`haccpSheetId`) REFERENCES `haccp_weekly_sheets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haccp_production_checks` ADD CONSTRAINT `haccp_production_checks_productionId_weekly_productions_id_fk` FOREIGN KEY (`productionId`) REFERENCES `weekly_productions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haccp_production_checks` ADD CONSTRAINT `haccp_production_checks_checkedBy_users_id_fk` FOREIGN KEY (`checkedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haccp_weekly_sheets` ADD CONSTRAINT `haccp_weekly_sheets_completedBy_users_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haccp_weekly_sheets` ADD CONSTRAINT `haccp_weekly_sheets_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;