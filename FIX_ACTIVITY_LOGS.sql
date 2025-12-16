-- Fix activity_logs foreign key constraint

-- Step 1: Drop existing table (it has wrong foreign key)
DROP TABLE IF EXISTS activity_logs;

-- Step 2: Create table with correct foreign key (admin_id → admin.id)
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  user_id INT NULL,
  user_role VARCHAR(50) NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_description TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_user_id (user_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Insert sample data for admin_id=8
INSERT INTO activity_logs 
  (admin_id, user_id, user_role, activity_type, activity_description, metadata, ip_address, user_agent, created_at) 
VALUES 
  (8, 1, 'user', 'TICKET_CREATED', 'User created ticket G-001 for General service', '{"ticketNumber":"G-001","service":"General"}', '127.0.0.1', 'Mozilla/5.0', NOW()),
  (8, 1, 'user', 'TICKET_CALLED', 'User called ticket G-001 at Counter 1', '{"ticketNumber":"G-001","counter":1}', '127.0.0.1', 'Mozilla/5.0', NOW()),
  (8, 8, 'admin', 'SERVICE_CREATED', 'Admin created new service: VIP Service', '{"serviceName":"VIP Service","prefix":"V"}', '127.0.0.1', 'Mozilla/5.0', NOW()),
  (8, 8, 'admin', 'SERVICE_UPDATED', 'Admin updated service: General', '{"serviceName":"General","prefix":"G"}', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (8, 1, 'user', 'LOGIN', 'User logged in successfully', '{"device":"Chrome on Windows"}', '192.168.1.100', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (8, 2, 'receptionist', 'TICKET_CREATED', 'Receptionist created ticket G-002 for customer John Doe', '{"ticketNumber":"G-002","customerName":"John Doe"}', '192.168.1.101', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Verify
SELECT COUNT(*) as total_logs FROM activity_logs WHERE admin_id = 8;
