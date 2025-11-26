import pool from "../config/database.js"

async function createAdminSessionsTable() {
  const connection = await pool.getConnection()
  
  try {
    console.log("Creating admin_sessions table...")
    
    // Create admin_sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id int(11) NOT NULL AUTO_INCREMENT,
        admin_id int(11) NOT NULL,
        username varchar(255) NOT NULL,
        role varchar(50) NOT NULL,
        token varchar(500) NOT NULL,
        device_info varchar(255) DEFAULT NULL,
        ip_address varchar(50) DEFAULT NULL,
        login_time timestamp NULL DEFAULT current_timestamp(),
        last_activity timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        expires_at timestamp NULL DEFAULT NULL,
        active tinyint(1) DEFAULT 1,
        PRIMARY KEY (session_id),
        KEY admin_id (admin_id),
        KEY token (token(255)),
        KEY active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log("✅ admin_sessions table created successfully")
    
    // Update user_sessions table structure
    console.log("Updating user_sessions table...")
    
    // Check if columns exist before adding
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM user_sessions
    `)
    
    const columnNames = columns.map(col => col.Field)
    
    if (!columnNames.includes('username')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN username varchar(255) DEFAULT NULL AFTER user_id`)
      console.log("✅ Added username column to user_sessions")
    }
    
    if (!columnNames.includes('token')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN token varchar(500) DEFAULT NULL AFTER device_id`)
      console.log("✅ Added token column to user_sessions")
    }
    
    if (!columnNames.includes('ip_address')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN ip_address varchar(50) DEFAULT NULL AFTER token`)
      console.log("✅ Added ip_address column to user_sessions")
    }
    
    if (!columnNames.includes('login_time')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN login_time timestamp NULL DEFAULT current_timestamp() AFTER ip_address`)
      console.log("✅ Added login_time column to user_sessions")
    }
    
    if (!columnNames.includes('expires_at')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN expires_at timestamp NULL DEFAULT NULL AFTER login_time`)
      console.log("✅ Added expires_at column to user_sessions")
    }
    
    if (!columnNames.includes('active')) {
      await connection.query(`ALTER TABLE user_sessions ADD COLUMN active tinyint(1) DEFAULT 1 AFTER expires_at`)
      console.log("✅ Added active column to user_sessions")
    }
    
    // Modify last_activity column
    await connection.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN last_activity timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
    `)
    console.log("✅ Updated last_activity column in user_sessions")
    
    console.log("\n🎉 Session management tables setup complete!")
    
  } catch (error) {
    console.error("❌ Error creating tables:", error.message)
  } finally {
    connection.release()
    process.exit()
  }
}

createAdminSessionsTable()
