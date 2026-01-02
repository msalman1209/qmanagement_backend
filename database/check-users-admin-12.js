import pool from "../config/database.js";

async function checkUsersForAdmin12() {
  try {
    console.log('🔍 Checking users for admin_id = 12...\n');
    
    // Query 1: All users with admin_id = 12
    const [allUsers] = await pool.query(
      'SELECT id, username, email, role, admin_id, status FROM users WHERE admin_id = 12'
    );
    
    console.log('📊 ALL Users with admin_id = 12:');
    console.table(allUsers);
    console.log(`Total: ${allUsers.length} users\n`);
    
    // Query 2: Users with ticket_info role
    const [ticketInfoUsers] = await pool.query(
      `SELECT id, username, email, role, admin_id, status 
       FROM users 
       WHERE admin_id = 12 
         AND (role = 'ticket_info' OR role LIKE '%ticket_info%')`
    );
    
    console.log('📋 Users with ticket_info role (admin_id = 12):');
    console.table(ticketInfoUsers);
    console.log(`Total: ${ticketInfoUsers.length} users\n`);
    
    // Query 3: Both users specifically
    const [bothUsers] = await pool.query(
      `SELECT id, username, email, role, admin_id, status 
       FROM users 
       WHERE admin_id = 12 
         AND (role LIKE '%receptionist,ticket_info%' OR role LIKE '%ticket_info,receptionist%')`
    );
    
    console.log('🎯 Both Users (dual role - admin_id = 12):');
    console.table(bothUsers);
    console.log(`Total: ${bothUsers.length} users\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersForAdmin12();
