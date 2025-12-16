import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: 3306,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const conn = await pool.getConnection();
    
    // Get user12 ID
    const [user12Result] = await conn.query('SELECT id, username FROM users WHERE username = ? LIMIT 1', ['user12']);
    
    if (user12Result.length === 0) {
      console.log('❌ user12 not found');
      conn.release();
      process.exit(0);
    }
    
    const userId = user12Result[0].id;
    console.log('✅ User12 ID:', userId);
    
    // Get all tickets
    const [allTickets] = await conn.query(
      `SELECT id, ticket_id, status, transfered, transfer_by, calling_user_time 
       FROM tickets WHERE representative_id = ? 
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );
    
    console.log('\n📊 TOTAL TICKETS FOR USER12:', allTickets.length);
    console.log('\n--- Breakdown:');
    
    const breakdown = {
      'Solved': 0,
      'Not Solved': 0,
      'Unattendant': 0,
      'Transferred': 0,
      'No calling_user_time': 0
    };
    
    allTickets.forEach(t => {
      if (!t.calling_user_time) {
        breakdown['No calling_user_time']++;
      } else if (t.transfered && t.transfered !== '0' && t.transfered !== '') {
        breakdown['Transferred']++;
      } else if (t.status === 'Solved') {
        breakdown['Solved']++;
      } else if (t.status === 'Not Solved') {
        breakdown['Not Solved']++;
      } else if (t.status === 'Unattendant') {
        breakdown['Unattendant']++;
      }
    });
    
    console.log(breakdown);
    
    // Now test the actual query used in getCompletedTickets
    console.log('\n🔍 TESTING ACTUAL QUERY FROM getCompletedTickets:');
    const [completedTickets] = await conn.query(
      `SELECT id, ticket_id, status, transfered, transfer_by, calling_user_time
       FROM tickets 
       WHERE representative_id = ?
         AND calling_user_time IS NOT NULL
         AND status IN ('Solved', 'Not Solved')
         AND (transfered IS NULL OR transfered = 0 OR transfered = '')
       ORDER BY calling_user_time DESC`,
      [userId]
    );
    
    console.log('✅ RETURNED:', completedTickets.length, 'completed tickets');
    console.log('\nSample tickets:');
    completedTickets.slice(0, 5).forEach(t => {
      console.log(`  - Ticket #${t.ticket_id}: ${t.status} (transferred: ${t.transfered})`);
    });
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
