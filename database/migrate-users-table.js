import pool from '../config/database.js'

async function migrateUsersTable() {
  const connection = await pool.getConnection()
  try {
    console.log('Starting users table migration...')

    // Add admin_id column if not exists
    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN admin_id INT(11) NULL AFTER password
      `)
      console.log('✓ admin_id column added')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ admin_id column already exists')
      } else {
        throw error
      }
    }

    // Add status column if not exists
    try {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER admin_id
      `)
      console.log('✓ status column added')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ status column already exists')
      } else {
        throw error
      }
    }

    // Add index on admin_id
    try {
      await connection.query(`
        ALTER TABLE users
        ADD KEY admin_id (admin_id)
      `)
      console.log('✓ index on admin_id added')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ index on admin_id already exists')
      } else if (error.errno === 1061 /* duplicate key name */) {
        console.log('✓ index on admin_id already exists')
      } else if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ index on admin_id already exists')
      } else {
        // Proceed even if index exists
        console.warn('Index creation warning:', error.message)
      }
    }

    // Add foreign key (ignore if already exists)
    try {
      await connection.query(`
        ALTER TABLE users
        ADD CONSTRAINT users_ibfk_admin FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL ON UPDATE CASCADE
      `)
      console.log('✓ foreign key users.admin_id -> admin.id added')
    } catch (error) {
      if (error.code === 'ER_CANT_CREATE_TABLE' || error.errno === 1826 /* duplicate FK */ || error.message?.includes('Duplicate')) {
        console.log('✓ foreign key already exists')
      } else {
        console.warn('Foreign key creation warning:', error.message)
      }
    }

    console.log('\n✅ Users table migration completed successfully!')
  } catch (error) {
    console.error('❌ Users table migration failed:', error)
    process.exitCode = 1
  } finally {
    connection.release()
    process.exit()
  }
}

migrateUsersTable()
