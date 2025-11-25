-- Update users table to link users to admins and add status

-- Add columns if they do not exist
ALTER TABLE `users`
  ADD COLUMN `admin_id` INT(11) NULL AFTER `password`,
  ADD COLUMN `status` VARCHAR(20) DEFAULT 'active' AFTER `admin_id`;

-- Add foreign key (ignore if already exists)
ALTER TABLE `users`
  ADD KEY `admin_id` (`admin_id`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
