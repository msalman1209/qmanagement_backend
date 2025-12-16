import pool from './config/database.js';

async function checkTimeFields() {
  const connection = await pool.getConnection();
  
  try {
    // Check schema
    const [columns] = await connection.query('DESCRIBE tickets');
    console.log('Time/Date fields in tickets table:');
    columns.forEach(col => {
      if (col.Field.includes('time') || col.Field.includes('date') || col.Field.includes('created')) {
        console.log(`  ${col.Field}: ${col.Type}`);
      }
    });
    
    // Check actual data
    console.log('\nSample ticket times:');
    const [tickets] = await connection.query('SELECT ticket_id, created_at, calling_user_time, status_time, transfered_time FROM tickets LIMIT 2');
    tickets.forEach(ticket => {
      console.log(`\nTicket ${ticket.ticket_id}:`);
      console.log(`  created_at: ${ticket.created_at}`);
      console.log(`  calling_user_time: ${ticket.calling_user_time}`);
      console.log(`  status_time: ${ticket.status_time}`);
      console.log(`  transfered_time: ${ticket.transfered_time}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkTimeFields();
