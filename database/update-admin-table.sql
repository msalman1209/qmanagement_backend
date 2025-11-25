-- Update admin table structure for license management and permissions

-- Add new columns to admin table
ALTER TABLE `admin` 
  MODIFY `password` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `role` VARCHAR(50) DEFAULT 'admin' AFTER `password`,
  ADD COLUMN `status` VARCHAR(20) DEFAULT 'active' AFTER `role`,
  ADD COLUMN `license_start_date` DATE NULL AFTER `status`,
  ADD COLUMN `license_end_date` DATE NULL AFTER `license_start_date`,
  ADD COLUMN `max_users` INT DEFAULT 10 AFTER `license_end_date`,
  ADD COLUMN `max_counters` INT DEFAULT 10 AFTER `max_users`,
  ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `max_counters`,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS `admin_permissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `manage_users` TINYINT(1) DEFAULT 0,
  `manage_services` TINYINT(1) DEFAULT 0,
  `view_reports` TINYINT(1) DEFAULT 0,
  `manage_configuration` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_permissions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing admin to be super_admin
UPDATE `admin` SET `role` = 'super_admin', `status` = 'active' WHERE `id` = 2;
