import pool from './config/database.js';

async function addTimezoneColumn() {
  const connection = await pool.getConnection();
  
  try {
    // Check if timezone column exists
    const [columns] = await connection.query('DESCRIBE admin');
    const hasTimezone = columns.some(col => col.Field === 'timezone');
    
    if (hasTimezone) {
      console.log('✅ Timezone column already exists');
    } else {
      console.log('Adding timezone column to admin table...');
      await connection.query(`
        ALTER TABLE admin 
        ADD COLUMN timezone VARCHAR(50) DEFAULT '+05:00'
      `);
      console.log('✅ Timezone column added successfully');
      
      // Update existing admins with default timezone
      await connection.query(`
        UPDATE admin SET timezone = '+05:00' WHERE timezone IS NULL
      `);
      console.log('✅ Set default timezone for existing admins');
    }
    
    // Show the result
    const [adminData] = await connection.query('SELECT id, username, timezone FROM admin LIMIT 3');
    console.log('\n📋 Admin timezone data:');
    console.table(adminData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addTimezoneColumn();
