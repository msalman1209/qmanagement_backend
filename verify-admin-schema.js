import pool from './config/database.js';

async function checkAdminTable() {
  const connection = await pool.getConnection();
  
  try {
    // Get column info
    const [columns] = await connection.query('DESCRIBE admin');
    console.log('Admin table columns:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkAdminTable();
