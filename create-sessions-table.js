import pool from './config/database.js';

async function createAdminSessionsTable() {
  try {
    console.log('Creating admin_sessions table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id INT(11) NOT NULL AUTO_INCREMENT,
        admin_id INT(11) NOT NULL,
        username VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        token VARCHAR(500) NOT NULL,
        device_info VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        login_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
        last_activity TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        expires_at TIMESTAMP NULL DEFAULT NULL,
        active TINYINT(1) DEFAULT 1,
        PRIMARY KEY (session_id),
        KEY admin_id (admin_id),
        KEY token (token(255)),
        KEY active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ admin_sessions table created successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createAdminSessionsTable();
