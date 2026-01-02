import pool from "./config/database.js";

async function checkSessions() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔍 Checking Sessions Data\n');
    console.log('='.repeat(80));
    
    // Get table structure
    console.log('\n📋 Table Structure:\n');
    const [columns] = await connection.query(`DESCRIBE user_sessions`);
    columns.forEach(col => {
      console.log(`   ${col.Field.padEnd(20)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });
    
    // Get active sessions with role filter
    console.log('\n\n📊 Active Sessions (Receptionist):\n');
    const [receptionist] = await connection.query(`
      SELECT 
        us.session_id as id,
        us.user_id,
        us.username,
        us.role as session_role,
        us.email,
        us.login_time,
        COALESCE(us.device_info, us.device_id) as device,
        u.role as user_role,
        u.admin_id
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.role = 'receptionist'
        AND us.active = 1
        AND us.expires_at > NOW()
      ORDER BY us.login_time DESC
      LIMIT 5
    `);
    
    if (receptionist.length > 0) {
      receptionist.forEach(s => {
        console.log(`   ID: ${s.id} | User: ${s.username} | User Role: ${s.user_role} | Session Role: ${s.session_role}`);
      });
    } else {
      console.log('   ❌ No receptionist sessions found');
    }
    
    console.log('\n\n📊 Active Sessions (Ticket Info):\n');
    const [ticketInfo] = await connection.query(`
      SELECT 
        us.session_id as id,
        us.user_id,
        us.username,
        us.role as session_role,
        us.email,
        us.login_time,
        COALESCE(us.device_info, us.device_id) as device,
        u.role as user_role,
        u.admin_id
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.role = 'ticket_info'
        AND us.active = 1
        AND us.expires_at > NOW()
      ORDER BY us.login_time DESC
      LIMIT 5
    `);
    
    if (ticketInfo.length > 0) {
      ticketInfo.forEach(s => {
        console.log(`   ID: ${s.id} | User: ${s.username} | User Role: ${s.user_role} | Session Role: ${s.session_role}`);
      });
    } else {
      console.log('   ❌ No ticket_info sessions found');
    }
    
    // Check for admin_id = 12
    console.log('\n\n🔍 Sessions for Admin ID = 12:\n');
    const [adminSessions] = await connection.query(`
      SELECT 
        us.session_id as id,
        us.username,
        us.role as session_role,
        u.role as user_role,
        u.admin_id,
        us.active,
        us.expires_at > NOW() as not_expired
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE u.admin_id = 12
      ORDER BY us.login_time DESC
      LIMIT 10
    `);
    
    if (adminSessions.length > 0) {
      adminSessions.forEach(s => {
        const status = s.active && s.not_expired ? '✅ Active' : '❌ Inactive';
        console.log(`   ${status} | ID: ${s.id} | User: ${s.username} | Session: ${s.session_role} | User Role: ${s.user_role}`);
      });
    } else {
      console.log('   ❌ No sessions found for admin_id = 12');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Check Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkSessions();
