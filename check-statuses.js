import pool from './config/database.js';

const userId = 1; // user12

try {
  // Check exact status values in database
  const [statuses] = await pool.query(
    `SELECT DISTINCT status FROM tickets WHERE representative_id = ? AND calling_user_time IS NOT NULL`,
    [userId]
  );
  
  console.log('✅ All unique statuses for user12:');
  statuses.forEach(s => console.log(`   "${s.status}"`));
  
  // Test with the exact spelling
  const [tickets] = await pool.query(
    `SELECT ticket_id, status, transfered
     FROM tickets 
     WHERE representative_id = ?
       AND calling_user_time IS NOT NULL
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')
     ORDER BY calling_user_time DESC`,
    [userId]
  );
  
  console.log('\n✅ All non-transferred tickets with calling_user_time:', tickets.length);
  
  const breakdown = {};
  tickets.forEach(t => {
    breakdown[t.status] = (breakdown[t.status] || 0) + 1;
  });
  
  console.log('\n📊 Breakdown:');
  Object.entries(breakdown).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
