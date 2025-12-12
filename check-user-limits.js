import pool from './config/database.js';

async function checkUserLimits() {
  try {
    console.log('🔍 Checking User Limits vs License\n');
    console.log('═'.repeat(80));

    const [admins] = await pool.query(`
      SELECT 
        a.id,
        a.username,
        l.max_users,
        l.max_receptionists,
        l.max_ticket_info_users,
        (SELECT COUNT(*) FROM users WHERE admin_id = a.id AND role = 'user') as current_users,
        (SELECT COUNT(*) FROM users WHERE admin_id = a.id AND role = 'receptionist') as current_receptionists,
        (SELECT COUNT(*) FROM users WHERE admin_id = a.id AND role = 'ticket_info') as current_ticket_info
      FROM admin a
      JOIN licenses l ON l.admin_id = a.id
      WHERE a.role = 'admin'
      ORDER BY a.id
    `);

    for (const admin of admins) {
      console.log(`\n📋 Admin: ${admin.username} (ID: ${admin.id})`);
      console.log('─'.repeat(80));
      
      // Check Users
      const userStatus = admin.current_users > admin.max_users ? '❌ EXCEEDED' : 
                        admin.current_users === admin.max_users ? '⚠️  AT LIMIT' : '✅ OK';
      console.log(`   Users:        ${admin.current_users}/${admin.max_users} ${userStatus}`);
      
      // Check Receptionists
      const recepStatus = admin.current_receptionists > admin.max_receptionists ? '❌ EXCEEDED' : 
                         admin.current_receptionists === admin.max_receptionists ? '⚠️  AT LIMIT' : '✅ OK';
      console.log(`   Receptionists: ${admin.current_receptionists}/${admin.max_receptionists} ${recepStatus}`);
      
      // Check Ticket Info
      const ticketStatus = admin.current_ticket_info > admin.max_ticket_info_users ? '❌ EXCEEDED' : 
                          admin.current_ticket_info === admin.max_ticket_info_users ? '⚠️  AT LIMIT' : '✅ OK';
      console.log(`   Ticket Info:   ${admin.current_ticket_info}/${admin.max_ticket_info_users} ${ticketStatus}`);

      if (admin.current_users > admin.max_users) {
        console.log(`\n   🚨 PROBLEM: ${admin.current_users - admin.max_users} extra users created!`);
      }
    }

    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserLimits();
