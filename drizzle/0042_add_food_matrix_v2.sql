-- Food Matrix V2: Entries (prodotti vendibili con ricetta semplificata)
CREATE TABLE `food_matrix_entries` (
  `id` varchar(36) NOT NULL,
  `storeId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Altro',
  `servingSize` decimal(10,3) NOT NULL DEFAULT 1.000,
  `servingUnit` varchar(50) NOT NULL DEFAULT 'porzione',
  `sellingPrice` decimal(10,2),
  `components` json NOT NULL,
  `costPerServing` decimal(10,4),
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `food_matrix_entries_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- Food Matrix V2: Snapshots (fotografie datate)
CREATE TABLE `food_matrix_snapshots` (
  `id` varchar(36) NOT NULL,
  `storeId` varchar(36) NOT NULL,
  `snapshotType` enum('PRICE_UPDATE','PRICE_EDIT') NOT NULL DEFAULT 'PRICE_EDIT',
  `description` text,
  `data` json NOT NULL,
  `createdBy` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `food_matrix_snapshots_pk` PRIMARY KEY(`id`)
);
