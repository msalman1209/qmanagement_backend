import pool from './config/database.js';

async function checkUserSchema() {
  const connection = await pool.getConnection();
  
  try {
    const [columns] = await connection.query('DESCRIBE users');
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    // Check if timezone column exists
    const hasTimezone = columns.some(col => col.Field === 'timezone');
    console.log(`\nTimezone column exists: ${hasTimezone ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkUserSchema();
