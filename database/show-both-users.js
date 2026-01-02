import pool from '../config/database.js';

console.log('🔍 Both Users in Database\n');

async function showBothUsers() {
  try {
    const [users] = await pool.query(`
      SELECT 
        id,
        username,
        email,
        role,
        admin_id,
        status,
        created_at
      FROM users 
      WHERE role LIKE '%receptionist%' AND role LIKE '%ticket_info%'
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log('📊 Users Table - Both Users (receptionist,ticket_info):');
    console.table(users);
    
    if (users.length > 0) {
      console.log('\n✅ Found', users.length, 'both_user(s) in users table');
      console.log('\n📝 Table Structure:');
      console.log('   Table Name: users');
      console.log('   Columns: id, username, email, password, role, admin_id, status, created_at, updated_at, permissions');
      console.log('\n🔑 Important Fields:');
      console.log('   - role: "receptionist,ticket_info" (comma-separated for both roles)');
      console.log('   - admin_id: Links to admin table (license owner)');
      console.log('   - email: Format is {admin}.user@{company}.com');
      console.log('   - password: Bcrypt hashed "QueUser123!"');
    } else {
      console.log('\n⚠️  No both_user found in users table');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

showBothUsers();
