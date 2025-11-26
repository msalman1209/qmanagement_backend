import pool from "../config/database.js"

async function createLicensesTable() {
  const connection = await pool.getConnection()
  
  try {
    console.log("Creating licenses table...")
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        admin_id INT NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        license_type ENUM('trial', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        max_users INT DEFAULT 10,
        max_counters INT DEFAULT 5,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_license_key (license_key),
        INDEX idx_admin_id (admin_id),
        INDEX idx_expiry_date (expiry_date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log("✓ Licenses table created successfully!")
    
    // Check if table exists and show structure
    const [tables] = await connection.query("SHOW TABLES LIKE 'licenses'")
    if (tables.length > 0) {
      console.log("\n✓ Table 'licenses' confirmed in database")
      
      const [columns] = await connection.query("DESCRIBE licenses")
      console.log("\nTable structure:")
      console.table(columns)
    }
    
  } catch (error) {
    console.error("Error creating licenses table:", error)
    throw error
  } finally {
    connection.release()
  }
}

// Run the migration
createLicensesTable()
  .then(() => {
    console.log("\n✓ Migration completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error)
    process.exit(1)
  })
