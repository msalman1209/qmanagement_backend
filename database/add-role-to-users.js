import pool from '../config/database.js'

async function addRoleToUsers() {
  const connection = await pool.getConnection()
  try {
    console.log('Starting users table migration to add role column...')

    // Add role column if not exists
    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN role ENUM('user', 'receptionist') DEFAULT 'user' AFTER password
      `)
      console.log('✓ role column added to users table')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ role column already exists')
      } else {
        throw error
      }
    }

    console.log('\n✅ Users table role column migration completed successfully!')
  } catch (error) {
    console.error('❌ Users table migration failed:', error)
    process.exitCode = 1
  } finally {
    connection.release()
    process.exit()
  }
}

addRoleToUsers()
