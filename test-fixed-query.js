import pool from './config/database.js';

const userId = 1; // user12

try {
  const [tickets] = await pool.query(
    `SELECT ticket_id, status, transfered
     FROM tickets 
     WHERE representative_id = ?
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattendant', 'Not Solved')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')
     ORDER BY calling_user_time DESC`,
    [userId]
  );
  
  console.log('✅ Total completed tickets:', tickets.length);
  
  const breakdown = {};
  tickets.forEach(t => {
    breakdown[t.status] = (breakdown[t.status] || 0) + 1;
  });
  
  console.log('Breakdown:', breakdown);
  console.log('\nFirst 5:');
  tickets.slice(0, 5).forEach(t => console.log(`  #${t.ticket_id}: ${t.status}`));
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
