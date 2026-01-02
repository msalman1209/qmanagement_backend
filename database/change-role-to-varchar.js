import pool from '../config/database.js';

console.log('🔄 Changing users.role from ENUM to VARCHAR...\n');

async function changeRoleField() {
  const connection = await pool.getConnection();
  
  try {
    // Check current role type
    const [columns] = await connection.query("DESCRIBE users");
    const roleField = columns.find(col => col.Field === 'role');
    
    console.log('Current role field:');
    console.log('  Type:', roleField.Type);
    console.log('  Default:', roleField.Default);
    
    // Change role from ENUM to VARCHAR to support comma-separated values
    console.log('\n📝 Changing role field to VARCHAR(100)...');
    
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(100) DEFAULT 'user'
    `);
    
    console.log('✅ Successfully changed role field to VARCHAR(100)');
    
    // Verify the change
    const [newColumns] = await connection.query("DESCRIBE users");
    const newRoleField = newColumns.find(col => col.Field === 'role');
    
    console.log('\n✅ New role field:');
    console.log('  Type:', newRoleField.Type);
    console.log('  Default:', newRoleField.Default);
    
    connection.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    connection.release();
    await pool.end();
    process.exit(1);
  }
}

changeRoleField();
