import pool from './config/database.js';

const userId = 1; // user12

try {
  console.log('🔍 VERIFYING TRANSFERRED TICKETS ARE EXCLUDED:\n');
  
  // All tickets with calling_user_time
  const [all] = await pool.query(
    `SELECT ticket_id, status, transfered FROM tickets 
     WHERE representative_id = ? AND calling_user_time IS NOT NULL`,
    [userId]
  );
  
  // Transferred tickets
  const [transferred] = await pool.query(
    `SELECT ticket_id, status, transfered FROM tickets 
     WHERE representative_id = ? AND calling_user_time IS NOT NULL 
     AND (transfered IS NOT NULL AND transfered != 0 AND transfered != '')`,
    [userId]
  );
  
  // Final query (what user sees)
  const [final] = await pool.query(
    `SELECT ticket_id, status, transfered FROM tickets 
     WHERE representative_id = ?
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')`,
    [userId]
  );
  
  console.log(`Total with calling_user_time: ${all.length}`);
  console.log(`Transferred (excluded): ${transferred.length}`);
  if (transferred.length > 0) {
    console.log('   Transferred tickets:');
    transferred.forEach(t => console.log(`     #${t.ticket_id}: ${t.status} -> ${t.transfered}`));
  }
  console.log(`\nFinal shown to user: ${final.length}`);
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
