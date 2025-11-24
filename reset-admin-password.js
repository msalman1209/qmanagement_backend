import bcryptjs from 'bcryptjs';
import pool from './config/database.js';

async function resetAdminPassword() {
  const connection = await pool.getConnection();
  
  try {
    const email = 'superadmin@example.com';
    const newPassword = 'superadmin@123';
    
    console.log('🔧 Resetting super admin password...');
    console.log('   Email:', email);
    console.log('   New Password:', newPassword);
    
    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    console.log('   New Hash:', hashedPassword);
    
    // Update password in database
    const [result] = await connection.query(
      'UPDATE admin SET password = ? WHERE email = ? AND role = ?',
      [hashedPassword, email, 'super_admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Password reset successful!');
      console.log('   You can now login with:');
      console.log('   Email:', email);
      console.log('   Password:', newPassword);
    } else {
      console.log('❌ No super admin found with email:', email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

resetAdminPassword();
