-- Seed semi_finished_recipes referenced by final_recipes components.
-- Uses INSERT IGNORE to avoid conflicts if rows already exist.
INSERT IGNORE INTO `semi_finished_recipes` (`id`, `storeId`, `code`, `name`, `category`, `finalPricePerKg`, `yieldPercentage`, `shelfLifeDays`, `storageMethod`, `components`, `createdAt`, `updatedAt`) VALUES
('c7fdf52f-705d-4ca9-b1c8-4f474e2e30ae', 'default-store-001', 'SALSE_SALSA_ALETTE', 'Salsa alette', 'SALSE', '0.00', '100.000', 3, 'Frigorifero', NULL, '2026-02-05 04:52:59', '2026-02-09 15:23:06'),
('TsxY0QJCoB7sd9SrW-7QV', 'default-store-001', 'VERDURA_CIPOLLA_CARAM', 'Cipolla caramellata', 'VERDURA', '0.00', '100.000', 5, 'Frigorifero', NULL, '2026-02-05 04:52:59', '2026-02-09 15:23:06'),
('vXdO0biDUzRAJLnlvxykg', 'default-store-001', 'VERDURA_AGLIO_ARROSTO', 'Aglio arrosto', 'VERDURA', '0.00', '100.000', 5, 'Frigorifero', NULL, '2026-02-05 04:52:59', '2026-02-09 15:23:06'),
('3RY7r6ujhRES0KwmjHbb9', 'default-store-001', 'SALSE_SALSA_MEMPHIS', 'Salsa Memphis', 'SALSE', '0.00', '100.000', 5, 'Frigorifero', NULL, '2026-02-05 04:52:59', '2026-02-09 15:23:06'),
('vPoz24LrGZDHC97Te9joG', 'default-store-001', 'SPEZIE_SPEZIE_PULLED', 'Spezie Pulled', 'SPEZIE', '0.00', '100.000', 30, 'Ambiente', NULL, '2026-02-05 04:52:59', '2026-02-09 15:23:06');
