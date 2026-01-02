import pool from './config/database.js';

async function checkSchema() {
  const connection = await pool.getConnection();
  
  try {
    // Check licenses table structure
    const [licenseColumns] = await connection.query("DESCRIBE licenses");
    
    console.log('\n📋 Licenses Table Schema:');
    console.table(licenseColumns);
    
    // Check users table structure
    const [userColumns] = await connection.query("DESCRIBE users");
    
    console.log('\n📋 Users Table Schema:');
    console.table(userColumns);
    
    // Check for both_user field
    const bothUserField = licenseColumns.find(col => col.Field === 'both_user');
    if (bothUserField) {
      console.log('\n✅ both_user field exists in licenses table');
      console.log('   Type:', bothUserField.Type);
      console.log('   Default:', bothUserField.Default);
    } else {
      console.log('\n⚠️ both_user field NOT found in licenses table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkSchema();
