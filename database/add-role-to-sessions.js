import pool from "../config/database.js";

async function addRoleToSessions() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔧 Adding role column to user_sessions table...\n');
    
    // Check if role column already exists
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM user_sessions LIKE 'role'`
    );
    
    if (columns.length > 0) {
      console.log('✅ Role column already exists in user_sessions table');
      return;
    }
    
    // Add role column
    await connection.query(`
      ALTER TABLE user_sessions 
      ADD COLUMN role VARCHAR(50) DEFAULT 'user' AFTER username
    `);
    
    console.log('✅ Role column added to user_sessions table');
    
    // Verify
    const [verify] = await connection.query(`DESCRIBE user_sessions`);
    console.log('\n📋 Updated user_sessions structure:');
    verify.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addRoleToSessions();
