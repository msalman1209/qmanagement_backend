import pool from "./config/database.js";

const checkLatestTicket = async () => {
  try {
    const conn = await pool.getConnection();
    
    // Get latest ticket with all timestamp fields
    const [tickets] = await conn.query(`
      SELECT 
        ticket_id,
        created_at,
        status_time,
        calling_user_time,
        transfered_time,
        last_updated,
        status,
        admin_id
      FROM tickets 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('Latest tickets:');
    console.log(JSON.stringify(tickets, null, 2));
    
    conn.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
};

checkLatestTicket();
