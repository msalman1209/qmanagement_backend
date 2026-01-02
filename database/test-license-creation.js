import pool from '../config/database.js';
import bcryptjs from 'bcryptjs';

console.log('🧪 Testing License Creation with Both User...\n');

async function createTestLicense() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Test license data
    const testData = {
      license_key: `TEST-${Date.now()}`,
      company_name: 'Test Company',
      admin_username: 'testadmin',
      admin_password: 'Test123!',
      email: `testadmin${Date.now()}@test.com`,
      license_type: 'basic',
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      max_users: 10,
      max_counters: 5,
      max_services: 10,
      max_sessions_per_receptionist: 3,
      max_sessions_per_ticket_info: 2,
      both_user: 1,
      status: 'active'
    };
    
    console.log('📝 Creating test license with data:');
    console.log('   Company:', testData.company_name);
    console.log('   Admin:', testData.admin_username);
    console.log('   Email:', testData.email);
    console.log('   Both User:', testData.both_user);
    console.log('');
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(testData.admin_password, 10);
    
    // Create admin
    const adminQuery = `
      INSERT INTO admin (
        username, email, password, role, license_key, license_expiry_date, 
        status, created_at
      ) VALUES (?, ?, ?, 'admin', ?, ?, ?, NOW())
    `;
    
    const [adminResult] = await connection.query(adminQuery, [
      testData.admin_username,
      testData.email,
      hashedPassword,
      testData.license_key,
      testData.expiry_date,
      testData.status
    ]);
    
    const newAdminId = adminResult.insertId;
    console.log('✅ Admin created with ID:', newAdminId);
    
    // Create license
    const licenseQuery = `
      INSERT INTO licenses (
        license_key, admin_id, admin_name, company_name, email, 
        license_type, start_date, expiry_date, 
        max_users, max_counters, max_services, 
        max_receptionist_sessions, max_ticket_info_sessions, both_user, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await connection.query(licenseQuery, [
      testData.license_key,
      newAdminId,
      testData.admin_username,
      testData.company_name,
      testData.email,
      testData.license_type,
      testData.start_date,
      testData.expiry_date,
      testData.max_users,
      testData.max_counters,
      testData.max_services,
      testData.max_sessions_per_receptionist,
      testData.max_sessions_per_ticket_info,
      testData.both_user,
      testData.status
    ]);
    
    console.log('✅ License created');
    
    // Create both_user
    if (testData.both_user >= 1) {
      const defaultUserEmail = `${testData.admin_username.toLowerCase().replace(/\s+/g, '')}.user@${testData.company_name.toLowerCase().replace(/\s+/g, '')}.com`;
      const defaultUserPassword = 'QueUser123!';
      const hashedUserPassword = await bcryptjs.hash(defaultUserPassword, 10);
      
      const userQuery = `
        INSERT INTO users (
          username, email, password, role, admin_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'active', NOW())
      `;
      
      await connection.query(userQuery, [
        `${testData.admin_username} User`,
        defaultUserEmail,
        hashedUserPassword,
        'receptionist,ticket_info',
        newAdminId
      ]);
      
      console.log('✅ Both user created:');
      console.log('   Email:', defaultUserEmail);
      console.log('   Password:', defaultUserPassword);
      console.log('   Role: receptionist,ticket_info');
    }
    
    await connection.commit();
    console.log('\n✅ Transaction committed successfully!');
    
    // Verify the user was created
    const [users] = await connection.query(
      'SELECT id, username, email, role FROM users WHERE admin_id = ?',
      [newAdminId]
    );
    
    console.log('\n📊 Verification - Users for this license:');
    console.table(users);
    
    connection.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
    connection.release();
    await pool.end();
    process.exit(1);
  }
}

createTestLicense();
