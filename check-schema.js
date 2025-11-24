import pool from './config/database.js';

async function checkSchema() {
  const connection = await pool.getConnection();
  
  try {
    // Check admin table structure
    const [columns] = await connection.query(
      "DESCRIBE admin"
    );
    
    console.log('\n📋 Admin Table Schema:');
    console.log(columns);
    
    const passwordCol = columns.find(col => col.Field === 'password');
    console.log('\n🔐 Password Column:');
    console.log('   Type:', passwordCol.Type);
    console.log('   Max Length:', passwordCol.Type.match(/\d+/)?.[0] || 'Unknown');
    
    // Check actual password length
    const [admins] = await connection.query(
      "SELECT email, LENGTH(password) as pwd_length, password FROM admin WHERE email = 'superadmin@example.com'"
    );
    
    console.log('\n📏 Current Password:');
    console.log('   Email:', admins[0].email);
    console.log('   Stored Length:', admins[0].pwd_length);
    console.log('   Password:', admins[0].password);
    console.log('\n⚠️ Bcrypt hash needs 60 characters minimum!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkSchema();
