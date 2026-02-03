CREATE TABLE `order_items` (
	`id` varchar(36) NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`itemType` enum('INGREDIENT','SEMI_FINISHED') NOT NULL,
	`itemId` varchar(36) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`supplier` varchar(255) NOT NULL,
	`quantityOrdered` decimal(10,3) NOT NULL,
	`unitType` enum('u','k') NOT NULL,
	`pricePerUnit` decimal(10,2) NOT NULL,
	`totalCost` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`weekId` varchar(50),
	`totalCost` decimal(10,2) NOT NULL,
	`pdfUrl` varchar(500),
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdBy` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
