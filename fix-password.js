import bcryptjs from 'bcryptjs';
import pool from './config/database.js';

async function fixPassword() {
  const connection = await pool.getConnection();
  
  try {
    // First, check current admin
    const [admins] = await connection.query(
      "SELECT * FROM admin WHERE email = 'superadmin@example.com'"
    );
    
    console.log('\n📋 Current Super Admin:');
    if (admins.length > 0) {
      console.log('   Email:', admins[0].email);
      console.log('   Username:', admins[0].username);
      console.log('   Role:', admins[0].role);
      console.log('   Current Password Hash:', admins[0].password);
    } else {
      console.log('   ❌ No admin found!');
      return;
    }
    
    // Hash new password
    const newPassword = 'superadmin@123';
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    console.log('\n🔧 Updating password...');
    console.log('   New Password:', newPassword);
    console.log('   New Hash:', hashedPassword);
    
    // Update
    const [result] = await connection.query(
      "UPDATE admin SET password = ? WHERE email = 'superadmin@example.com'",
      [hashedPassword]
    );
    
    console.log('   Rows affected:', result.affectedRows);
    
    // Verify
    const [updated] = await connection.query(
      "SELECT * FROM admin WHERE email = 'superadmin@example.com'"
    );
    
    console.log('\n✅ Verification:');
    console.log('   New Hash in DB:', updated[0].password);
    
    // Test password
    const match = await bcryptjs.compare(newPassword, updated[0].password);
    console.log('   Password Test:', match ? '✅ MATCH' : '❌ FAILED');
    
    if (match) {
      console.log('\n🎉 SUCCESS! Login credentials:');
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

fixPassword();
