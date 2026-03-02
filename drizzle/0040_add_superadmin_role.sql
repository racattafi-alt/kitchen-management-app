-- Add superadmin role to users table
-- Superadmin changes propagate to all stores automatically
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('user', 'admin', 'manager', 'cook', 'superadmin') NOT NULL DEFAULT 'user';
