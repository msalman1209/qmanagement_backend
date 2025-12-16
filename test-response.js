import pool from './config/database.js';

const userId = 1; // user12

try {
  const [tickets] = await pool.query(
    `SELECT 
       t.id,
       t.ticket_id as ticket_number,
       t.service_name,
       t.status,
       t.created_at as ticket_created_time,
       t.calling_time as call_count,
       t.calling_user_time as called_time,
       t.status_time as status_update_time,
       t.counter_no as solved_by_counter,
       t.caller,
       t.representative_id,
       t.transfered,
       t.transfer_by,
       t.transfered_time,
       t.reason
     FROM tickets t
     WHERE t.representative_id = ?
       AND t.calling_user_time IS NOT NULL
       AND t.status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
       AND (t.transfered IS NULL OR t.transfered = 0 OR t.transfered = '')
     ORDER BY t.calling_user_time DESC, t.created_at DESC
     LIMIT 3`,
    [userId]
  );

  console.log('📊 RAW DATABASE RESPONSE (first 3):');
  console.table(tickets);
  
  // Format like backend does
  const formattedTickets = tickets.map(ticket => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    service: ticket.service_name,
    status: ticket.status,
    ticketCreatedTime: ticket.ticket_created_time,
    calledTime: ticket.called_time,
    statusUpdateTime: ticket.status_update_time || ticket.called_time || ticket.ticket_created_time,
    calledCount: ticket.call_count || 0,
    transferInfo: ticket.transfer_by ? `Transferred by ${ticket.transfer_by}` : 'Not Transferred',
    transferTime: ticket.transfered_time || '0000-00-00 00:00:00',
    solvedBy: ticket.solved_by_counter || 'N/A',
    reason: ticket.reason || '',
    representativeId: ticket.representative_id
  }));
  
  console.log('\n📤 FORMATTED FOR FRONTEND (first 3):');
  console.log(JSON.stringify(formattedTickets.slice(0, 3), null, 2));
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
