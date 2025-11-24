import bcryptjs from 'bcryptjs';
import pool from './config/database.js';

async function createAdmin() {
  const connection = await pool.getConnection();
  
  try {
    const adminData = {
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin@123',
      role: 'admin'
    };
    
    console.log('🔧 Creating admin user...');
    console.log('   Email:', adminData.email);
    console.log('   Username:', adminData.username);
    console.log('   Password:', adminData.password);
    console.log('   Role:', adminData.role);
    
    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT * FROM admin WHERE email = ?',
      [adminData.email]
    );
    
    if (existing.length > 0) {
      console.log('\n⚠️  Admin already exists! Updating password...');
      
      const hashedPassword = await bcryptjs.hash(adminData.password, 10);
      
      await connection.query(
        'UPDATE admin SET password = ?, username = ?, role = ? WHERE email = ?',
        [hashedPassword, adminData.username, adminData.role, adminData.email]
      );
      
      console.log('✅ Admin updated successfully!');
    } else {
      // Hash the password
      const hashedPassword = await bcryptjs.hash(adminData.password, 10);
      
      // Insert new admin
      await connection.query(
        'INSERT INTO admin (username, email, password, role) VALUES (?, ?, ?, ?)',
        [adminData.username, adminData.email, hashedPassword, adminData.role]
      );
      
      console.log('✅ Admin created successfully!');
    }
    
    // Verify
    const [admins] = await connection.query(
      'SELECT email, username, role FROM admin WHERE role = "admin"'
    );
    
    console.log('\n📋 All Regular Admins:');
    console.table(admins);
    
    console.log('\n🎉 You can now login with:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin@123');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

createAdmin();
