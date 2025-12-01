import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const testLicensing = async () => {
  let connection
  
  try {
    console.log("🧪 Starting License System Tests...")
    console.log("=" .repeat(60))
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "u998585094_demoqueue",
      port: process.env.DB_PORT || 3306
    })

    console.log("✅ Database connected\n")

    // Test 1: Check if admin table has license columns
    console.log("📋 Test 1: Checking admin table structure...")
    const [adminColumns] = await connection.query(`
      SHOW COLUMNS FROM admin LIKE '%license%'
    `)
    
    if (adminColumns.length >= 2) {
      console.log("✅ Admin table has license columns:")
      adminColumns.forEach(col => {
        console.log(`   - ${col.Field}`)
      })
    } else {
      console.log("❌ Admin table missing license columns")
    }

    // Test 2: Check if licenses table exists
    console.log("\n📋 Test 2: Checking licenses table...")
    try {
      const [licenseColumns] = await connection.query(`
        SHOW COLUMNS FROM licenses
      `)
      console.log(`✅ Licenses table exists with ${licenseColumns.length} columns:`)
      licenseColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`)
      })
    } catch (error) {
      console.log("❌ Licenses table does not exist")
    }

    // Test 3: Check if admin_sessions table exists
    console.log("\n📋 Test 3: Checking admin_sessions table...")
    try {
      const [sessionColumns] = await connection.query(`
        SHOW COLUMNS FROM admin_sessions
      `)
      console.log(`✅ Admin_sessions table exists with ${sessionColumns.length} columns`)
    } catch (error) {
      console.log("❌ Admin_sessions table does not exist")
    }

    // Test 4: Check if super admin exists
    console.log("\n📋 Test 4: Checking super admin account...")
    const [superAdmins] = await connection.query(`
      SELECT id, username, email, role, status 
      FROM admin 
      WHERE role = 'super_admin'
    `)
    
    if (superAdmins.length > 0) {
      console.log("✅ Super admin account(s) found:")
      superAdmins.forEach(admin => {
        console.log(`   - Username: ${admin.username}`)
        console.log(`   - Email: ${admin.email}`)
        console.log(`   - Status: ${admin.status}`)
      })
    } else {
      console.log("❌ No super admin account found")
    }

    // Test 5: Check existing licenses
    console.log("\n📋 Test 5: Checking existing licenses...")
    const [licenses] = await connection.query(`
      SELECT 
        l.id,
        l.license_key,
        l.company_name,
        l.license_type,
        l.status,
        l.expiry_date,
        DATEDIFF(l.expiry_date, CURDATE()) as days_remaining,
        a.username as admin_username
      FROM licenses l
      LEFT JOIN admin a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `)
    
    if (licenses.length > 0) {
      console.log(`✅ Found ${licenses.length} license(s):`)
      licenses.forEach((lic, index) => {
        console.log(`\n   License ${index + 1}:`)
        console.log(`   - Key: ${lic.license_key}`)
        console.log(`   - Company: ${lic.company_name}`)
        console.log(`   - Type: ${lic.license_type}`)
        console.log(`   - Status: ${lic.status}`)
        console.log(`   - Days Remaining: ${lic.days_remaining}`)
        console.log(`   - Admin: ${lic.admin_username}`)
      })
    } else {
      console.log("ℹ️  No licenses found (this is okay for new setup)")
    }

    // Test 6: Check indexes
    console.log("\n📋 Test 6: Checking database indexes...")
    const [adminIndexes] = await connection.query(`
      SHOW INDEX FROM admin WHERE Key_name LIKE 'idx_%'
    `)
    
    console.log(`✅ Admin table has ${adminIndexes.length} custom indexes`)

    try {
      const [licenseIndexes] = await connection.query(`
        SHOW INDEX FROM licenses WHERE Key_name LIKE 'idx_%'
      `)
      console.log(`✅ Licenses table has ${licenseIndexes.length} custom indexes`)
    } catch (error) {
      console.log("ℹ️  Licenses table not yet created")
    }

    // Test 7: Check foreign keys
    console.log("\n📋 Test 7: Checking foreign key constraints...")
    try {
      const [constraints] = await connection.query(`
        SELECT 
          TABLE_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('licenses', 'admin_sessions', 'users', 'services')
      `, [process.env.DB_NAME || "u998585094_demoqueue"])
      
      if (constraints.length > 0) {
        console.log(`✅ Found ${constraints.length} foreign key constraint(s):`)
        constraints.forEach(constraint => {
          console.log(`   - ${constraint.TABLE_NAME}.${constraint.CONSTRAINT_NAME} -> ${constraint.REFERENCED_TABLE_NAME}`)
        })
      } else {
        console.log("ℹ️  No foreign keys found")
      }
    } catch (error) {
      console.log("ℹ️  Could not check foreign keys")
    }

    // Test 8: License Statistics
    console.log("\n📋 Test 8: License statistics...")
    try {
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_licenses,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
          SUM(CASE WHEN DATEDIFF(expiry_date, CURDATE()) <= 7 AND status = 'active' THEN 1 ELSE 0 END) as expiring_soon
        FROM licenses
      `)
      
      const stat = stats[0]
      console.log("✅ License Statistics:")
      console.log(`   - Total Licenses: ${stat.total_licenses}`)
      console.log(`   - Active: ${stat.active}`)
      console.log(`   - Expired: ${stat.expired}`)
      console.log(`   - Suspended: ${stat.suspended}`)
      console.log(`   - Expiring Soon (7 days): ${stat.expiring_soon}`)
    } catch (error) {
      console.log("ℹ️  No licenses to show statistics")
    }

    // Final Summary
    console.log("\n" + "=".repeat(60))
    console.log("🎉 Test Summary")
    console.log("=".repeat(60))
    
    let allTestsPassed = true
    
    // Check critical components
    if (adminColumns.length < 2) {
      console.log("❌ Admin table needs license columns")
      allTestsPassed = false
    }
    
    try {
      await connection.query("SELECT 1 FROM licenses LIMIT 1")
      console.log("✅ Licenses table is ready")
    } catch (error) {
      console.log("❌ Licenses table not found")
      allTestsPassed = false
    }
    
    if (superAdmins.length === 0) {
      console.log("❌ Super admin account not found")
      allTestsPassed = false
    } else {
      console.log("✅ Super admin account exists")
    }

    if (allTestsPassed) {
      console.log("\n🎉 All critical tests passed!")
      console.log("✅ License system is ready to use")
    } else {
      console.log("\n⚠️  Some tests failed")
      console.log("💡 Run: node database/setup-licensing.js")
    }

    console.log("\n" + "=".repeat(60))

  } catch (error) {
    console.error("\n❌ Error during testing:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log("\n✅ Database connection closed")
    }
  }
}

// Run the tests
testLicensing()
