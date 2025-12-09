import pool from "./config/database.js";

async function checkTicketsDateColumn() {
  try {
    console.log('Checking tickets table structure...\n');
    
    // Check table structure
    const [columns] = await pool.query("SHOW COLUMNS FROM tickets");
    console.log('Tickets table columns:');
    console.table(columns);
    
    // Check sample data
    console.log('\nSample ticket data:');
    const [sampleTickets] = await pool.query("SELECT ticket_id, date, caller, status FROM tickets LIMIT 5");
    console.table(sampleTickets);
    
    // Check date format
    console.log('\nChecking date formats:');
    const [dateFormats] = await pool.query(`
      SELECT 
        date,
        DATE(date) as date_only,
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
        caller,
        status
      FROM tickets 
      LIMIT 5
    `);
    console.table(dateFormats);
    
    // Check date range
    console.log('\nDate range in tickets:');
    const [dateRange] = await pool.query(`
      SELECT 
        MIN(DATE(date)) as earliest_date,
        MAX(DATE(date)) as latest_date,
        COUNT(*) as total_tickets
      FROM tickets
    `);
    console.table(dateRange);
    
    // Test with specific date filter
    const testStartDate = '2025-01-01';
    const testEndDate = '2025-12-31';
    console.log(`\nTesting date filter: ${testStartDate} to ${testEndDate}`);
    
    const [filteredTickets] = await pool.query(`
      SELECT 
        COUNT(*) as count,
        DATE(date) as ticket_date
      FROM tickets
      WHERE DATE(date) BETWEEN ? AND ?
      GROUP BY DATE(date)
      ORDER BY ticket_date
    `, [testStartDate, testEndDate]);
    
    console.log('Filtered tickets by date:');
    console.table(filteredTickets);
    
    await pool.end();
    console.log('\nCheck complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTicketsDateColumn();
