import pool from './config/database.js';

try {
  // Check ticket p-2 specifically
  const [ticket] = await pool.query(
    `SELECT id, ticket_id, status, transfered, transfer_by FROM tickets 
     WHERE ticket_id = 'p-2' AND representative_id = 1
     ORDER BY id DESC LIMIT 1`
  );
  
  console.log('🔍 Ticket p-2 Details:');
  if (ticket.length) {
    console.log(ticket[0]);
    console.log(`\n   transfered value: "${ticket[0].transfered}" (type: ${typeof ticket[0].transfered})`);
    console.log(`   transfer_by value: "${ticket[0].transfer_by}"`);
    console.log(`   transfered === null: ${ticket[0].transfered === null}`);
    console.log(`   transfered === 0: ${ticket[0].transfered === 0}`);
    console.log(`   transfered === "": ${ticket[0].transfered === ""}`);
    console.log(`   transfered == 0: ${ticket[0].transfered == 0}`);
    console.log(`   transfered == "": ${ticket[0].transfered == ""}`);
  }
  
  // Check all transferred tickets
  const [transferred] = await pool.query(
    `SELECT DISTINCT transfered FROM tickets 
     WHERE representative_id = 1 AND transfered IS NOT NULL`
  );
  
  console.log('\n📋 All non-NULL transfered values:');
  transferred.forEach(t => {
    console.log(`   "${t.transfered}" (type: ${typeof t.transfered}, length: ${String(t.transfered).length})`);
  });
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
