-- Create admin_sessions table for tracking admin login sessions
CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`session_id`),
  KEY `admin_id` (`admin_id`),
  KEY `token` (`token`(255)),
  KEY `active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update user_sessions table structure
ALTER TABLE `user_sessions` 
  ADD COLUMN IF NOT EXISTS `username` varchar(255) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN IF NOT EXISTS `token` varchar(500) DEFAULT NULL AFTER `device_id`,
  ADD COLUMN IF NOT EXISTS `ip_address` varchar(50) DEFAULT NULL AFTER `token`,
  ADD COLUMN IF NOT EXISTS `login_time` timestamp NULL DEFAULT current_timestamp() AFTER `ip_address`,
  ADD COLUMN IF NOT EXISTS `expires_at` timestamp NULL DEFAULT NULL AFTER `login_time`,
  ADD COLUMN IF NOT EXISTS `active` tinyint(1) DEFAULT 1 AFTER `expires_at`,
  MODIFY COLUMN `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();
