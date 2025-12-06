-- Add status column to users table
-- This allows admins to activate/deactivate user accounts

ALTER TABLE `users` 
ADD COLUMN `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active' AFTER `password`,
ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `status`,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Add index for status column for faster queries
ALTER TABLE `users` ADD INDEX `idx_status` (`status`);

-- Update all existing users to active status (if not already set)
UPDATE `users` SET `status` = 'active' WHERE `status` IS NULL;
