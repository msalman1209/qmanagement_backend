import pool from './config/database.js';

try {
  // Test the NEW fix
  const [with_fix] = await pool.query(
    `SELECT id, ticket_id, status, transfered FROM tickets 
     WHERE representative_id = 1
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND COALESCE(transfered, '0') IN ('', '0', 0)
     ORDER BY calling_user_time DESC`
  );
  
  console.log('✅ WITH NEW FILTER:', with_fix.length, 'tickets');
  
  // Check if p-2 is still there
  const p2 = with_fix.find(t => t.ticket_id === 'p-2');
  if (p2) {
    console.log('❌ ERROR: p-2 still showing!');
    console.log('   transfered:', p2.transfered);
  } else {
    console.log('✅ p-2 is properly excluded!');
  }
  
  // Check breakdown
  const breakdown = {};
  with_fix.forEach(t => {
    breakdown[t.status] = (breakdown[t.status] || 0) + 1;
  });
  
  console.log('\n📊 Breakdown:');
  console.log(breakdown);
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
