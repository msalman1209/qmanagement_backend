import pool from "./config/database.js";

async function testSessionLimits() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔍 Testing Session Limits from Database\n');
    console.log('='.repeat(60));
    
    // Get active licenses with session limits
    const [licenses] = await connection.query(
      `SELECT id, admin_id, company_name, 
              max_receptionist_sessions, 
              max_ticket_info_sessions,
              both_user_receptionist_sessions,
              both_user_ticket_info_sessions,
              both_user
       FROM licenses 
       WHERE status = 'active' 
       LIMIT 5`
    );
    
    console.log('\n📊 Active Licenses:\n');
    licenses.forEach(license => {
      console.log(`License ID: ${license.id}`);
      console.log(`Company: ${license.company_name}`);
      console.log(`Admin ID: ${license.admin_id}`);
      console.log(`Max Receptionist Sessions: ${license.max_receptionist_sessions}`);
      console.log(`Max Ticket Info Sessions: ${license.max_ticket_info_sessions}`);
      console.log(`Both User: ${license.both_user}`);
      console.log(`Both User Receptionist Sessions: ${license.both_user_receptionist_sessions}`);
      console.log(`Both User Ticket Info Sessions: ${license.both_user_ticket_info_sessions}`);
      console.log('-'.repeat(60));
    });
    
    // Get users with both roles
    const [bothUsers] = await connection.query(
      `SELECT id, username, email, role, admin_id 
       FROM users 
       WHERE role LIKE '%,%' 
       LIMIT 5`
    );
    
    console.log('\n👥 Both Users (Comma-separated roles):\n');
    bothUsers.forEach(user => {
      console.log(`User ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Admin ID: ${user.admin_id}`);
      console.log('-'.repeat(60));
    });
    
    // Check active sessions
    const [sessions] = await connection.query(
      `SELECT user_id, role, COUNT(*) as count 
       FROM user_sessions 
       WHERE active = 1 AND expires_at > NOW() 
       GROUP BY user_id, role`
    );
    
    console.log('\n🔓 Active Sessions:\n');
    sessions.forEach(session => {
      console.log(`User ID: ${session.user_id} | Role: ${session.role} | Active Sessions: ${session.count}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete!\n');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

testSessionLimits();
