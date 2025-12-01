import mysql from "mysql2/promise"
import dotenv from "dotenv"
import bcryptjs from "bcryptjs"

dotenv.config()

const setupLicensing = async () => {
  let connection
  
  try {
    console.log("🚀 Starting License System Setup...")
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "u998585094_demoqueue",
      port: process.env.DB_PORT || 3306
    })

    console.log("✅ Database connected")

    // Step 1: Check and update admin table structure
    console.log("\n📋 Step 1: Updating admin table...")
    
    // Add role column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS role ENUM('super_admin', 'admin') DEFAULT 'admin'
    `).catch(() => console.log("   ℹ️  Role column already exists"))

    // Add license_key column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS license_key VARCHAR(255) DEFAULT NULL
    `).catch(() => console.log("   ℹ️  license_key column already exists"))

    // Add license_expiry_date column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS license_expiry_date DATE DEFAULT NULL
    `).catch(() => console.log("   ℹ️  license_expiry_date column already exists"))

    // Add status column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
    `).catch(() => console.log("   ℹ️  status column already exists"))

    // Add created_at column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `).catch(() => console.log("   ℹ️  created_at column already exists"))

    // Add updated_at column if not exists
    await connection.query(`
      ALTER TABLE admin 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `).catch(() => console.log("   ℹ️  updated_at column already exists"))

    // Modify password column to support longer hashes
    await connection.query(`
      ALTER TABLE admin 
      MODIFY COLUMN password VARCHAR(255)
    `).catch(() => console.log("   ℹ️  Password column already updated"))

    console.log("✅ Admin table updated")

    // Step 2: Create admin_sessions table
    console.log("\n📋 Step 2: Creating admin_sessions table...")
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id INT(11) NOT NULL AUTO_INCREMENT,
        admin_id INT(11) NOT NULL,
        token VARCHAR(500) NOT NULL,
        device_info VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        PRIMARY KEY (session_id),
        KEY idx_admin_id (admin_id),
        KEY idx_token (token(255)),
        KEY idx_expires_at (expires_at),
        FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log("✅ admin_sessions table created")

    // Step 3: Create licenses table
    console.log("\n📋 Step 3: Creating licenses table...")
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INT(11) NOT NULL AUTO_INCREMENT,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        admin_id INT(11) NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        license_type ENUM('trial', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        max_users INT(11) DEFAULT 10,
        max_counters INT(11) DEFAULT 5,
        max_services INT(11) DEFAULT 10,
        features JSON DEFAULT NULL,
        status ENUM('active', 'inactive', 'suspended', 'expired') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_license_key (license_key),
        KEY idx_admin_id (admin_id),
        KEY idx_expiry_date (expiry_date),
        KEY idx_status (status),
        KEY idx_license_type (license_type),
        FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log("✅ licenses table created")

    // Step 4: Add admin_id column to users table if not exists
    console.log("\n📋 Step 4: Updating users table...")
    
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS admin_id INT(11) DEFAULT NULL
    `).catch(() => console.log("   ℹ️  admin_id column already exists in users table"))

    await connection.query(`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_admin 
      FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL
    `).catch(() => console.log("   ℹ️  Foreign key constraint already exists"))

    console.log("✅ users table updated")

    // Step 5: Add admin_id column to services table if not exists
    console.log("\n📋 Step 5: Updating services table...")
    
    await connection.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS admin_id INT(11) DEFAULT NULL
    `).catch(() => console.log("   ℹ️  admin_id column already exists in services table"))

    await connection.query(`
      ALTER TABLE services 
      ADD CONSTRAINT fk_services_admin 
      FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL
    `).catch(() => console.log("   ℹ️  Foreign key constraint already exists"))

    console.log("✅ services table updated")

    // Step 6: Create super admin account
    console.log("\n📋 Step 6: Creating super admin account...")
    
    const [existingSuperAdmin] = await connection.query(
      "SELECT id FROM admin WHERE role = 'super_admin' LIMIT 1"
    )

    if (existingSuperAdmin.length === 0) {
      const hashedPassword = await bcryptjs.hash("SuperAdmin@123", 10)
      
      await connection.query(`
        INSERT INTO admin (username, email, password, role, status, created_at)
        VALUES (?, ?, ?, 'super_admin', 'active', NOW())
      `, ['superadmin', 'superadmin@qmanagement.com', hashedPassword])

      console.log("✅ Super admin account created")
      console.log("   Username: superadmin")
      console.log("   Password: SuperAdmin@123")
      console.log("   ⚠️  Please change this password after first login!")
    } else {
      console.log("   ℹ️  Super admin account already exists")
    }

    // Step 7: Add indexes for better performance
    console.log("\n📋 Step 7: Adding indexes...")
    
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_license_key ON admin(license_key)
    `).catch(() => console.log("   ℹ️  Index already exists"))

    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_role ON admin(role)
    `).catch(() => console.log("   ℹ️  Index already exists"))

    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_status ON admin(status)
    `).catch(() => console.log("   ℹ️  Index already exists"))

    console.log("✅ Indexes created")

    console.log("\n" + "=".repeat(60))
    console.log("🎉 License System Setup Completed Successfully!")
    console.log("=".repeat(60))
    console.log("\n📝 Summary:")
    console.log("   ✓ Admin table updated with license fields")
    console.log("   ✓ Admin sessions table created")
    console.log("   ✓ Licenses table created")
    console.log("   ✓ Users and Services tables updated")
    console.log("   ✓ Super admin account created/verified")
    console.log("   ✓ Database indexes added")
    console.log("\n🚀 Next Steps:")
    console.log("   1. Start your backend server")
    console.log("   2. Login as super admin")
    console.log("   3. Create licenses for admins")
    console.log("   4. Test the licensing system")
    console.log("\n" + "=".repeat(60))

  } catch (error) {
    console.error("\n❌ Error during setup:", error)
    console.error("\nError details:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log("\n✅ Database connection closed")
    }
  }
}

// Run the setup
setupLicensing()
