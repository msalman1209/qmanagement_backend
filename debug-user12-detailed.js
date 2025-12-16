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
    console.log('✅ User12 ID:', userId, '\n');
    
    // Get ALL tickets with calling_user_time
    console.log('📋 ALL TICKETS WITH calling_user_time:');
    const [allWithCalling] = await conn.query(
      `SELECT id, ticket_id, status, transfered, calling_user_time 
       FROM tickets 
       WHERE representative_id = ? AND calling_user_time IS NOT NULL
       ORDER BY calling_user_time DESC`,
      [userId]
    );
    
    console.log('Count:', allWithCalling.length);
    allWithCalling.forEach(t => {
      console.log(`  #${t.ticket_id}: ${t.status} | Transferred: ${t.transfered} | Called: ${t.calling_user_time}`);
    });
    
    console.log('\n🔍 TICKETS THAT SHOULD BE FILTERED OUT:');
    const [filtered] = await conn.query(
      `SELECT id, ticket_id, status, transfered, calling_user_time
       FROM tickets 
       WHERE representative_id = ? 
         AND calling_user_time IS NOT NULL
         AND (transfered IS NOT NULL AND transfered != 0 AND transfered != '')
       ORDER BY calling_user_time DESC`,
      [userId]
    );
    
    console.log('Transferred tickets:', filtered.length);
    filtered.forEach(t => {
      console.log(`  #${t.ticket_id}: ${t.status} | Transferred: ${t.transfered}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
