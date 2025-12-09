import pool from "./config/database.js";

async function checkActualDates() {
  try {
    console.log('Checking actual date values in database...\n');
    
    const [results] = await pool.query(`
      SELECT 
        ticket_id,
        date as raw_date,
        DATE(date) as date_only,
        caller,
        status
      FROM tickets
      ORDER BY date
      LIMIT 10
    `);
    
    console.table(results);
    
    // Check what MySQL sees as the date
    console.log('\nMySQL date interpretation:');
    const [dateCheck] = await pool.query(`
      SELECT 
        date,
        CAST(date AS DATE) as cast_date,
        DATE_FORMAT(date, '%Y-%m-%d') as formatted_date
      FROM tickets
      LIMIT 3
    `);
    console.table(dateCheck);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkActualDates();
