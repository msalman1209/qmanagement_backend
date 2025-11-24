-- Insert Super Admin
INSERT INTO super_admins (username, email, password, name, is_active)
VALUES ('superadmin', 'superadmin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'Super Administrator', TRUE);

-- Insert Sample Admins (password: admin123)
INSERT INTO admins (username, email, password, name, license_expiry_date, is_active, is_blocked, created_by)
VALUES 
('admin1', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'Admin One', '2025-12-31', TRUE, FALSE, 1),
('admin2', 'admin2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'Admin Two', '2025-11-30', TRUE, FALSE, 1);

-- Insert Sample Services
INSERT INTO services (name, description, created_by)
VALUES 
('General Inquiry', 'General questions and inquiries', 1),
('Payment Processing', 'Payment and billing services', 1),
('Technical Support', 'Technical assistance', 1),
('Account Management', 'Account-related services', 1);

-- Insert Sample Users (password: user123)
INSERT INTO users (username, email, password, name, created_by, is_active)
VALUES 
('user1', 'user@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'User One', 1, TRUE),
('user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'User Two', 1, TRUE),
('user3', 'user3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO246Y', 'User Three', 1, TRUE);
