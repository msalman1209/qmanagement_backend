-- Add role column to admin table to differentiate between admin and super_admin
ALTER TABLE `admin` ADD COLUMN `role` ENUM('admin', 'super_admin') DEFAULT 'admin' AFTER `password`;

-- Update existing admin to super_admin if needed
-- UPDATE `admin` SET `role` = 'super_admin' WHERE `email` = 'admin@gmail.com';
