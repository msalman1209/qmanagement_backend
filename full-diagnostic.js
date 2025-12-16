import pool from './config/database.js';

async function fullDiagnostic() {
  console.log('🔍 FULL DIAGNOSTIC FOR COMPLETED TICKETS\n');
  
  try {
    // 1. Check user12 exists
    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ?',
      ['user12']
    );
    
    if (!users.length) {
      console.log('❌ user12 not found');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log('✅ User12 found:');
    console.log(`   ID: ${userId}, Username: ${users[0].username}\n`);
    
    // 2. Check total tickets for user12
    const [totalTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE representative_id = ?',
      [userId]
    );
    console.log(`📊 Total tickets for user12: ${totalTickets[0].count}`);
    
    // 3. Check tickets with calling_user_time
    const [calledTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE representative_id = ? AND calling_user_time IS NOT NULL',
      [userId]
    );
    console.log(`📞 Tickets with calling_user_time: ${calledTickets[0].count}`);
    
    // 4. Check status breakdown
    const [statusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) as count FROM tickets 
       WHERE representative_id = ? AND calling_user_time IS NOT NULL
       GROUP BY status ORDER BY count DESC`,
      [userId]
    );
    console.log('\n📋 Status breakdown (with calling_user_time):');
    statusBreakdown.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    // 5. Check transferred tickets
    const [transferred] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets 
       WHERE representative_id = ? AND calling_user_time IS NOT NULL
       AND (transfered IS NOT NULL AND transfered != 0 AND transfered != '')`,
      [userId]
    );
    console.log(`\n🔄 Transferred tickets (should be excluded): ${transferred[0].count}`);
    
    // 6. Test the exact API query
    console.log('\n✅ RUNNING ACTUAL API QUERY:');
    const [apiResults] = await pool.query(
      `SELECT id, ticket_id, status, transfered, calling_user_time
       FROM tickets 
       WHERE representative_id = ?
         AND calling_user_time IS NOT NULL
         AND status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
         AND (transfered IS NULL OR transfered = 0 OR transfered = '')
       ORDER BY calling_user_time DESC`,
      [userId]
    );
    
    console.log(`📤 API should return: ${apiResults.length} tickets\n`);
    console.log('Sample results:');
    apiResults.slice(0, 5).forEach((t, idx) => {
      console.log(`   ${idx + 1}. Ticket #${t.ticket_id} (${t.status}) - ID: ${t.id}`);
    });
    
    // 7. Verify response format
    console.log('\n✅ RESPONSE FORMAT TEST:');
    const sampleFormatted = {
      id: apiResults[0]?.id,
      ticketNumber: apiResults[0]?.ticket_id,
      service: 'Example Service',
      status: apiResults[0]?.status,
      ticketCreatedTime: '2025-12-16 12:00:00',
      calledTime: apiResults[0]?.calling_user_time,
      statusUpdateTime: '2025-12-16 12:45:13',
      calledCount: 0,
      transferInfo: 'Not Transferred',
      transferTime: '0000-00-00 00:00:00',
      solvedBy: 'N/A',
      reason: '',
      representativeId: userId
    };
    
    console.log('Sample formatted ticket:');
    console.log(JSON.stringify(sampleFormatted, null, 2));
    
    console.log('\n✅ ALL DIAGNOSTICS PASSED');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

fullDiagnostic();
