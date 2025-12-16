import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createActivityLogsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Drop existing table if it has wrong foreign key
    console.log('🗑️ Dropping existing activity_logs table if exists...');
    await connection.query(`DROP TABLE IF EXISTS activity_logs`);
    console.log('✅ Old table dropped');
    
    // Create activity_logs table with correct foreign key
    console.log('\n📝 Creating activity_logs table with correct foreign key...');
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Activity logs table created successfully!');
    
    // Add some sample logs for testing
    const sampleLogs = [
      {
        admin_id: 1,
        user_id: 2,
        user_role: 'user',
        activity_type: 'TICKET_CREATED',
        activity_description: 'User generated a new ticket for service: General Inquiry',
        metadata: JSON.stringify({
          ticket_number: 'A001',
          service_name: 'General Inquiry',
          counter: 1
        })
      },
      {
        admin_id: 1,
        user_id: 3,
        user_role: 'receptionist',
        activity_type: 'TICKET_CALLED',
        activity_description: 'Receptionist called ticket A001 to counter 1',
        metadata: JSON.stringify({
          ticket_number: 'A001',
          counter: 1
        })
      },
      {
        admin_id: 1,
        user_id: 1,
        user_role: 'admin',
        activity_type: 'SERVICE_CREATED',
        activity_description: 'Admin created a new service: VIP Service',
        metadata: JSON.stringify({
          service_name: 'VIP Service',
          service_type: 'premium'
        })
      }
    ];

    for (const log of sampleLogs) {
      await connection.query(
        'INSERT INTO activity_logs (admin_id, user_id, user_role, activity_type, activity_description, metadata) VALUES (?, ?, ?, ?, ?, ?)',
        [log.admin_id, log.user_id, log.user_role, log.activity_type, log.activity_description, log.metadata]
      );
    }

    console.log('✅ Sample activity logs inserted!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createActivityLogsTable();
