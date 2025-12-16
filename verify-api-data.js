import pool from './config/database.js';

try {
  console.log('🔍 CHECKING USER12 TICKETS\n');
  
  // Get user12 ID
  const [user12] = await pool.query(
    'SELECT id, username FROM users WHERE username = ?',
    ['user12']
  );
  
  if (!user12.length) {
    console.log('❌ user12 not found');
    process.exit(1);
  }
  
  const userId = user12[0].id;
  console.log(`User12 ID: ${userId}\n`);
  
  // Count tickets by status
  const [statusCount] = await pool.query(
    `SELECT status, COUNT(*) as count FROM tickets 
     WHERE representative_id = ? AND calling_user_time IS NOT NULL
     GROUP BY status`,
    [userId]
  );
  
  console.log('📊 Tickets by Status (with calling_user_time):');
  statusCount.forEach(row => {
    console.log(`   ${row.status}: ${row.count}`);
  });
  
  // Count transferred
  const [transferred] = await pool.query(
    `SELECT COUNT(*) as count FROM tickets 
     WHERE representative_id = ? AND calling_user_time IS NOT NULL
     AND (transfered IS NOT NULL AND transfered != 0 AND transfered != '')`,
    [userId]
  );
  
  console.log(`\nTransferred tickets: ${transferred[0].count}`);
  
  // What the API should return
  const [apiResult] = await pool.query(
    `SELECT COUNT(*) as count FROM tickets 
     WHERE representative_id = ?
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')`,
    [userId]
  );
  
  console.log(`\n✅ API Should Return: ${apiResult[0].count} tickets`);
  
  // Show actual tickets
  const [tickets] = await pool.query(
    `SELECT ticket_id, status, transfered FROM tickets 
     WHERE representative_id = ?
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')
     ORDER BY calling_user_time DESC
     LIMIT 10`,
    [userId]
  );
  
  console.log('\n📋 Sample tickets:');
  tickets.forEach(t => {
    console.log(`   #${t.ticket_id}: ${t.status}`);
  });
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
