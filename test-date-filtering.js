import pool from "./config/database.js";

async function testDateFiltering() {
  try {
    const startDate = '2025-12-01';
    const endDate = '2025-12-31';
    
    console.log(`\nTesting date filter: ${startDate} to ${endDate}\n`);
    
    // Test the actual query used in getReports
    const query = `
      SELECT 
        u.username,
        u.id as user_id,
        (
          SELECT COUNT(*)
          FROM tickets t1
          WHERE t1.caller = u.username
          AND DATE(t1.date) BETWEEN ? AND ?
        ) as total,
        (
          SELECT COUNT(*)
          FROM tickets t2
          WHERE t2.caller = u.username
          AND (LOWER(TRIM(t2.status)) = 'solved' OR TRIM(t2.status) = 'Solved')
          AND DATE(t2.date) BETWEEN ? AND ?
        ) as total_solved,
        (
          SELECT COUNT(*)
          FROM tickets t3
          WHERE t3.caller = u.username
          AND (LOWER(TRIM(t3.status)) = 'not solved' OR TRIM(t3.status) = 'Not Solved')
          AND DATE(t3.date) BETWEEN ? AND ?
        ) as not_solved,
        (
          SELECT COUNT(*)
          FROM tickets t4
          WHERE t4.caller = u.username
          AND (LOWER(TRIM(t4.status)) = 'Unattended' OR TRIM(t4.status) = 'Unattended' OR TRIM(t4.status) = 'unattendant' OR TRIM(t4.status) = 'Unattendant' OR LOWER(TRIM(t4.status)) = 'pending' OR TRIM(t4.status) = 'Pending')
          AND DATE(t4.date) BETWEEN ? AND ?
        ) as unattended_tickets,
        (
          SELECT COUNT(*)
          FROM tickets t5
          WHERE t5.transfer_by = u.username
          AND DATE(t5.date) BETWEEN ? AND ?
        ) as transferred
      FROM users u
      WHERE u.role = 'user'
      ORDER BY u.username
    `;
    
    const queryParams = [
      startDate, endDate,  // total
      startDate, endDate,  // total_solved
      startDate, endDate,  // not_solved
      startDate, endDate,  // unattended_tickets
      startDate, endDate   // transferred
    ];
    
    console.log('Query params:', queryParams);
    
    const [reports] = await pool.query(query, queryParams);
    
    console.log(`\nFound ${reports.length} users with tickets\n`);
    console.table(reports);
    
    // Also check raw ticket data for comparison
    console.log('\nRaw ticket data in date range:');
    const [tickets] = await pool.query(`
      SELECT 
        DATE(date) as ticket_date,
        caller,
        status,
        COUNT(*) as count
      FROM tickets
      WHERE DATE(date) BETWEEN ? AND ?
      GROUP BY DATE(date), caller, status
      ORDER BY caller, ticket_date
    `, [startDate, endDate]);
    
    console.table(tickets);
    
    await pool.end();
    console.log('\nTest complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDateFiltering();
