import pool from './config/database.js';
import bcryptjs from 'bcryptjs';

async function fixDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Fixing password column size...');
    
    // Alter password column to varchar(255)
    await connection.query(
      "ALTER TABLE admin MODIFY COLUMN password VARCHAR(255)"
    );
    
    console.log('✅ Password column updated to VARCHAR(255)');
    
    // Now update the password
    const newPassword = 'superadmin@123';
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    console.log('\n🔐 Updating super admin password...');
    console.log('   Password:', newPassword);
    console.log('   Hash Length:', hashedPassword.length);
    
    await connection.query(
      "UPDATE admin SET password = ? WHERE email = 'superadmin@example.com'",
      [hashedPassword]
    );
    
    // Verify
    const [admins] = await connection.query(
      "SELECT email, LENGTH(password) as pwd_length, password FROM admin WHERE email = 'superadmin@example.com'"
    );
    
    console.log('\n✅ Verification:');
    console.log('   Email:', admins[0].email);
    console.log('   Stored Length:', admins[0].pwd_length);
    console.log('   Full Hash Stored:', admins[0].pwd_length === hashedPassword.length ? '✅ YES' : '❌ NO');
    
    // Test password
    const match = await bcryptjs.compare(newPassword, admins[0].password);
    console.log('   Password Match:', match ? '✅ SUCCESS' : '❌ FAILED');
    
    if (match) {
      console.log('\n🎉 ALL DONE! Login credentials:');
      console.log('   Email: superadmin@example.com');
      console.log('   Password: superadmin@123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

fixDatabase();
