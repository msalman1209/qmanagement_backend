import pool from './config/database.js';

try {
  // Get tickets with all relevant fields
  const [tickets] = await pool.query(
    `SELECT 
       id,
       ticket_id,
       service_name,
       status,
       created_at,
       calling_time,
       calling_user_time,
       status_time,
       counter_no,
       transfer_by,
       transfered,
       transfered_time
     FROM tickets 
     WHERE representative_id = 1
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')
     LIMIT 5`
  );
  
  console.log('✅ COMPLETED TICKETS FOR USER12:');
  console.log(`Total: ${tickets.length}\n`);
  
  tickets.forEach((t, idx) => {
    console.log(`Ticket ${idx + 1}:`);
    console.log(`  ID: ${t.id}`);
    console.log(`  Number: ${t.ticket_id}`);
    console.log(`  Service: ${t.service_name}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Created: ${t.created_at}`);
    console.log(`  Called: ${t.calling_user_time}`);
    console.log(`  Call Count: ${t.calling_time}`);
    console.log(`  Counter: ${t.counter_no}`);
    console.log(`  Transferred: ${t.transfered}`);
    console.log('');
  });
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
