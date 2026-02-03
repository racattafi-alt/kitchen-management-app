CREATE TABLE `cloud_storage` (
	`id` varchar(36) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`documentType` enum('HACCP','SUPPLIER_CERT','BATCH_PHOTO','COMPLIANCE') NOT NULL,
	`relatedEntityId` varchar(36),
	`relatedEntityType` enum('PRODUCTION_BATCH','INGREDIENT','RECIPE'),
	`uploadedBy` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cloud_storage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `final_recipes` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('Pane','Carne','Salse','Verdure','Formaggi','Altro') NOT NULL,
	`components` json,
	`yieldPercentage` decimal(5,3) NOT NULL,
	`totalCost` decimal(10,2) NOT NULL,
	`productionOperations` json,
	`conservationMethod` text NOT NULL,
	`maxConservationTime` varchar(50) NOT NULL,
	`serviceWastePercentage` decimal(5,3) DEFAULT '0',
	`serviceWastePerIngredient` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `final_recipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `final_recipes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `food_matrix` (
	`id` varchar(36) NOT NULL,
	`sourceType` enum('INGREDIENT','SEMI_FINISHED','FINAL_RECIPE') NOT NULL,
	`sourceId` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tag` enum('FIC','AQ') NOT NULL,
	`unitType` enum('u','k') NOT NULL,
	`pricePerKgOrUnit` decimal(10,2) NOT NULL,
	`suggestedPortion` decimal(10,3),
	`weightPerUnit` decimal(10,3),
	`categoryForMenu` enum('Pane','Salse','Carne','Verdure','Formaggi','Altro') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `food_matrix_id` PRIMARY KEY(`id`),
	CONSTRAINT `food_matrix_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `haccp` (
	`id` varchar(36) NOT NULL,
	`productionBatchId` varchar(36) NOT NULL,
	`recipeName` varchar(255) NOT NULL,
	`batchId` varchar(50) NOT NULL,
	`plannedDate` datetime NOT NULL,
	`ingredients` json,
	`checkpoints` json,
	`operatorSignature` varchar(255),
	`managerVerification` varchar(255),
	`storageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `haccp_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`supplier` varchar(255) NOT NULL,
	`category` enum('Additivi','Carni','Farine','Latticini','Verdura','Spezie','Altro') NOT NULL,
	`unitType` enum('u','k') NOT NULL,
	`packageQuantity` decimal(10,3) NOT NULL,
	`packagePrice` decimal(10,2) NOT NULL,
	`pricePerKgOrUnit` decimal(10,2) NOT NULL,
	`minOrderQuantity` decimal(10,3),
	`brand` varchar(255),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` varchar(36) NOT NULL,
	`menuTypeId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('PANINI','CARNE_AL_PIATTO','INSALATE','BEVANDE','PROMOZIONI') NOT NULL,
	`components` json,
	`suggestedSalePrice` decimal(10,2) NOT NULL,
	`actualSalePrice` decimal(10,2) NOT NULL,
	`isPromotion` boolean DEFAULT false,
	`promotionComponents` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_types` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`serviceType` enum('DINE_IN','DELIVERY','TAKEAWAY','EVENT') NOT NULL,
	`fixedCosts` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`costType` enum('ENERGIA','LAVORO') NOT NULL,
	`maxKw` decimal(10,3),
	`efficiencyMultiplier` decimal(5,3),
	`avgConsumptionKw` decimal(10,3),
	`hourlyRate` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_batches` (
	`id` varchar(36) NOT NULL,
	`batchCode` varchar(50) NOT NULL,
	`recipeFinalId` varchar(36) NOT NULL,
	`plannedDate` datetime NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`unitType` enum('u','k') NOT NULL,
	`status` enum('PLANNED','IN_PROGRESS','COMPLETED','FAILED') DEFAULT 'PLANNED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_batches_batchCode_unique` UNIQUE(`batchCode`)
);
--> statement-breakpoint
CREATE TABLE `semi_finished_recipes` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('SPEZIE','SALSE','VERDURA','CARNE','ALTRO') NOT NULL,
	`finalPricePerKg` decimal(10,2) NOT NULL,
	`yieldPercentage` decimal(5,3) NOT NULL,
	`shelfLifeDays` int NOT NULL,
	`storageMethod` text NOT NULL,
	`totalQuantityProduced` decimal(10,3),
	`components` json,
	`productionSteps` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `semi_finished_recipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `semi_finished_recipes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `waste_records` (
	`id` varchar(36) NOT NULL,
	`productionBatchId` varchar(36),
	`componentId` varchar(36) NOT NULL,
	`wasteType` enum('PRODUCTION','SERVICE') NOT NULL,
	`wastePercentage` decimal(5,3) NOT NULL,
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waste_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_productions` (
	`id` varchar(36) NOT NULL,
	`weekStartDate` datetime NOT NULL,
	`recipeFinalId` varchar(36) NOT NULL,
	`desiredQuantity` decimal(10,3) NOT NULL,
	`unitType` enum('u','k') NOT NULL,
	`currentStock` decimal(10,3) DEFAULT '0',
	`status` enum('PLANNED','IN_PRODUCTION','COMPLETED','CANCELLED') DEFAULT 'PLANNED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_productions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','cook') NOT NULL DEFAULT 'user';