import pool from "../config/database.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const addUserStatusColumn = async () => {
  const connection = await pool.getConnection()
  
  try {
    console.log("🔍 Checking if status column exists in users table...")

    // Check if status column already exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'status'"
    )

    if (columns.length > 0) {
      console.log("✅ Status column already exists in users table")
      return
    }

    console.log("📝 Adding status column to users table...")

    // Add status column
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' AFTER password
    `)

    console.log("✅ Status column added successfully")

    // Check if created_at exists
    const [createdAtCol] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'created_at'"
    )

    if (createdAtCol.length === 0) {
      console.log("📝 Adding created_at column...")
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status
      `)
      console.log("✅ created_at column added")
    }

    // Check if updated_at exists
    const [updatedAtCol] = await connection.query(
      "SHOW COLUMNS FROM users LIKE 'updated_at'"
    )

    if (updatedAtCol.length === 0) {
      console.log("📝 Adding updated_at column...")
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `)
      console.log("✅ updated_at column added")
    }

    // Add index for status
    console.log("📝 Adding index for status column...")
    try {
      await connection.query("ALTER TABLE users ADD INDEX idx_status (status)")
      console.log("✅ Index added for status column")
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log("ℹ️ Index already exists")
      } else {
        throw err
      }
    }

    // Update existing users to active
    const [result] = await connection.query(
      "UPDATE users SET status = 'active' WHERE status IS NULL"
    )
    
    console.log(`✅ Updated ${result.affectedRows} users to active status`)

    // Show final structure
    const [finalColumns] = await connection.query("SHOW COLUMNS FROM users")
    console.log("\n📊 Final users table structure:")
    console.table(finalColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Default: col.Default
    })))

    console.log("\n✅ Users table updated successfully!")
    console.log("ℹ️  Inactive users will now be blocked from logging in")

  } catch (error) {
    console.error("❌ Error updating users table:", error)
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

// Run the migration
addUserStatusColumn()
  .then(() => {
    console.log("🎉 Migration completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error)
    process.exit(1)
  })
