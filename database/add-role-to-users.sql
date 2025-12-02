-- Add role column to users table for receptionist functionality

ALTER TABLE `users`
ADD COLUMN `role` ENUM('user', 'receptionist') DEFAULT 'user' AFTER `password`;
