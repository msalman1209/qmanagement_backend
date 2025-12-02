import pool from '../config/database.js';

async function fixUserSessions() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Fixing user_sessions table...');

    // Drop existing table
    await connection.query('DROP TABLE IF EXISTS user_sessions');
    console.log('✅ Old user_sessions table dropped');

    // Create new table with all required columns
    await connection.query(`
      CREATE TABLE user_sessions (
        session_id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        username VARCHAR(50) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        counter_no VARCHAR(250) DEFAULT NULL,
        admin_id INT(11) DEFAULT NULL,
        token VARCHAR(500) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        device_info VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        active TINYINT(1) DEFAULT 1,
        PRIMARY KEY (session_id),
        KEY user_id (user_id),
        KEY idx_token (token(255)),
        KEY idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ New user_sessions table created with all columns');

    console.log('✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user_sessions:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

fixUserSessions();
