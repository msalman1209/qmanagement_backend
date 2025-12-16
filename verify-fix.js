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
  queueLimit: 0,
  timezone: "+05:00",
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true
});

(async () => {
  try {
    const conn = await pool.getConnection();
    
    // Get user12
    const [user12Result] = await conn.query('SELECT id, username FROM users WHERE username = ? LIMIT 1', ['user12']);
    
    if (user12Result.length === 0) {
      console.log('❌ user12 not found');
      conn.release();
      process.exit(0);
    }
    
    const userId = user12Result[0].id;
    console.log('✅ User12 ID:', userId);
    console.log('\n🔍 USING FIXED QUERY (includes Unattended + excludes Transferred):');
    
    // Using the FIXED query
    const [completedTickets] = await conn.query(
      `SELECT id, ticket_id, status, transfered, calling_user_time
       FROM tickets 
       WHERE representative_id = ?
         AND calling_user_time IS NOT NULL
         AND status IN ('Solved', 'Unattendant', 'Not Solved')
         AND (transfered IS NULL OR transfered = 0 OR transfered = '')
       ORDER BY calling_user_time DESC`,
      [userId]
    );
    
    console.log('✅ TOTAL COMPLETED TICKETS:', completedTickets.length);
    
    // Breakdown
    const breakdown = {
      'Solved': 0,
      'Not Solved': 0,
      'Unattended': 0
    };
    
    completedTickets.forEach(t => {
      if (t.status === 'Solved') breakdown['Solved']++;
      else if (t.status === 'Not Solved') breakdown['Not Solved']++;
      else if (t.status === 'Unattendant') breakdown['Unattended']++;
    });
    
    console.log('\n📊 Breakdown:');
    console.log(`   Solved: ${breakdown['Solved']}`);
    console.log(`   Not Solved: ${breakdown['Not Solved']}`);
    console.log(`   Unattended: ${breakdown['Unattended']}`);
    
    console.log('\n📋 Sample tickets:');
    completedTickets.slice(0, 10).forEach(t => {
      console.log(`   #${t.ticket_id}: ${t.status}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
