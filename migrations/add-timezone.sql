-- Add timezone column to admin table
ALTER TABLE admin ADD COLUMN timezone VARCHAR(50) DEFAULT '+05:00';

-- Add timezone column to users table (if exists)
ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT '+05:00';

-- Create a settings table for timezone preferences
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL UNIQUE,
  timezone VARCHAR(50) DEFAULT '+05:00',
  country VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
