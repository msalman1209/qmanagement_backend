import pool from './config/database.js';

try {
  // Test WITHOUT the filter
  const [without] = await pool.query(
    `SELECT id, ticket_id, status, transfered FROM tickets 
     WHERE representative_id = 1
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
     ORDER BY calling_user_time DESC`
  );
  
  console.log('WITHOUT transfered filter:', without.length, 'tickets');
  const withTransfer = without.filter(t => t.transfered && t.transfered !== '0' && t.transfered !== '');
  console.log('  - With transfered value:', withTransfer.length);
  withTransfer.forEach(t => console.log(`    #${t.ticket_id}: transfered=${t.transfered}`));
  
  // Test WITH the filter
  const [with_filter] = await pool.query(
    `SELECT id, ticket_id, status, transfered FROM tickets 
     WHERE representative_id = 1
       AND calling_user_time IS NOT NULL
       AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (transfered IS NULL OR transfered = 0 OR transfered = '')
     ORDER BY calling_user_time DESC`
  );
  
  console.log('\nWITH transfered filter:', with_filter.length, 'tickets');
  const stillTransferred = with_filter.filter(t => t.transfered);
  if (stillTransferred.length > 0) {
    console.log('  ⚠️ WARNING: Still showing transferred tickets!');
    stillTransferred.forEach(t => console.log(`    #${t.ticket_id}: transfered=${t.transfered}`));
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
