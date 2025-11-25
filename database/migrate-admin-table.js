import pool from '../config/database.js';

async function migrateAdminTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting admin table migration...');

    // Modify password column
    await connection.query(`
      ALTER TABLE admin 
      MODIFY password VARCHAR(255) DEFAULT NULL
    `);
    console.log('✓ Password column updated');

    // Add role column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN role VARCHAR(50) DEFAULT 'admin' AFTER password
      `);
      console.log('✓ Role column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Role column already exists');
      } else {
        throw error;
      }
    }

    // Add status column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER role
      `);
      console.log('✓ Status column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Status column already exists');
      } else {
        throw error;
      }
    }

    // Add license_start_date column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN license_start_date DATE NULL AFTER status
      `);
      console.log('✓ License start date column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ License start date column already exists');
      } else {
        throw error;
      }
    }

    // Add license_end_date column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN license_end_date DATE NULL AFTER license_start_date
      `);
      console.log('✓ License end date column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ License end date column already exists');
      } else {
        throw error;
      }
    }

    // Add max_users column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN max_users INT DEFAULT 10 AFTER license_end_date
      `);
      console.log('✓ Max users column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Max users column already exists');
      } else {
        throw error;
      }
    }

    // Add max_counters column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN max_counters INT DEFAULT 10 AFTER max_users
      `);
      console.log('✓ Max counters column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Max counters column already exists');
      } else {
        throw error;
      }
    }

    // Add created_at column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER max_counters
      `);
      console.log('✓ Created at column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Created at column already exists');
      } else {
        throw error;
      }
    }

    // Add updated_at column if not exists
    try {
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);
      console.log('✓ Updated at column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Updated at column already exists');
      } else {
        throw error;
      }
    }

    // Create admin_permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_permissions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        admin_id INT(11) NOT NULL,
        manage_users TINYINT(1) DEFAULT 0,
        manage_services TINYINT(1) DEFAULT 0,
        view_reports TINYINT(1) DEFAULT 0,
        manage_configuration TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY admin_id (admin_id),
        CONSTRAINT admin_permissions_ibfk_1 FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Admin permissions table created');

    // Update existing admin to super_admin
    await connection.query(`
      UPDATE admin 
      SET role = 'super_admin', status = 'active' 
      WHERE id = 2
    `);
    console.log('✓ Updated existing admin to super_admin');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateAdminTable();
