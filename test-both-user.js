import pool from './config/database.js';

console.log('🔍 Testing Both User System...\n');

async function testBothUser() {
  try {
    // Check licenses with both_user field
    const [licenses] = await pool.query(
      'SELECT id, license_key, company_name, admin_name, admin_id, max_receptionist_sessions, max_ticket_info_sessions, both_user, created_at FROM licenses ORDER BY id DESC LIMIT 5'
    );
    
    console.log('📋 Last 5 Licenses:');
    console.table(licenses);
    
    if (licenses.length > 0) {
      const latestLicense = licenses[0];
      console.log(`\n🔍 Checking users for license: ${latestLicense.company_name} (Admin: ${latestLicense.admin_name})`);
      console.log(`   License ID: ${latestLicense.id}, Admin ID: ${latestLicense.admin_id}\n`);
      
      // Check users with both roles (using admin_id from licenses table)
      const [bothUsers] = await pool.query(
        `SELECT id, username, email, role, admin_id 
         FROM users 
         WHERE admin_id = ? AND (role LIKE '%receptionist%' AND role LIKE '%ticket_info%')
         ORDER BY id DESC`,
        [latestLicense.admin_id]  // Use admin_id instead of license id
      );
      
      console.log('👥 Users with BOTH roles (receptionist,ticket_info):');
      if (bothUsers.length > 0) {
        console.table(bothUsers);
        console.log(`\n✅ Found ${bothUsers.length} both_user(s)`);
        console.log(`📧 Default email format: ${latestLicense.admin_name}.user@${latestLicense.company_name}.com`);
        console.log(`🔑 Default password: QueUser123!`);
      } else {
        console.log('⚠️  No both_user found for this license!');
        console.log('Expected email:', `${latestLicense.admin_name}.user@${latestLicense.company_name}.com`);
      }
      
      // Also check all users for this admin
      const [allUsers] = await pool.query(
        `SELECT id, username, email, role 
         FROM users 
         WHERE admin_id = ? 
         ORDER BY id DESC`,
        [latestLicense.admin_id]  // Use admin_id instead of license id
      );
      
      console.log(`\n📊 All users for this license (${allUsers.length} total):`);
      console.table(allUsers);
    } else {
      console.log('⚠️  No licenses found in database');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testBothUser();
