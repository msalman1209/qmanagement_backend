import pool from "../config/database.js";

// Test the exact query used in getTicketInfoUsers controller
async function testQuery() {
  try {
    const adminId = 12;
    
    console.log('🧪 Testing getTicketInfoUsers query with admin_id:', adminId);
    console.log('📝 Query:');
    console.log(`
      SELECT 
        id, username, email, role, status, created_at,
        CASE 
          WHEN role LIKE '%receptionist,ticket_info%' OR role LIKE '%ticket_info,receptionist%' THEN 'both'
          ELSE 'ticket_info_only'
        END as user_type
      FROM users 
      WHERE admin_id = ? 
        AND (role = 'ticket_info' OR role LIKE '%ticket_info%')
      ORDER BY created_at DESC
    `);
    
    const [users] = await pool.query(
      `SELECT 
        id, username, email, role, status, created_at,
        CASE 
          WHEN role LIKE '%receptionist,ticket_info%' OR role LIKE '%ticket_info,receptionist%' THEN 'both'
          ELSE 'ticket_info_only'
        END as user_type
      FROM users 
      WHERE admin_id = ? 
        AND (role = 'ticket_info' OR role LIKE '%ticket_info%')
      ORDER BY created_at DESC`,
      [adminId]
    );

    console.log('\n✅ Query executed successfully');
    console.log(`📊 Found ${users.length} user(s):\n`);
    console.table(users);
    
    console.log('\n📦 JSON Response:');
    console.log(JSON.stringify({ success: true, users: users }, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testQuery();
