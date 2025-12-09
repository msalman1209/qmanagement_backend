import pool from "./config/database.js";

async function testMultipleDateRanges() {
  try {
    console.log('Testing different date ranges...\n');
    
    const testCases = [
      { start: '2025-12-01', end: '2025-12-02' },
      { start: '2025-12-03', end: '2025-12-03' },
      { start: '2025-12-07', end: '2025-12-08' },
      { start: '2025-12-01', end: '2025-12-31' },
      { start: '2025-01-01', end: '2025-11-30' }, // Should return 0
    ];
    
    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Date Range: ${testCase.start} to ${testCase.end}`);
      console.log('='.repeat(60));
      
      const [results] = await pool.query(`
        SELECT 
          u.username,
          (SELECT COUNT(*) FROM tickets t WHERE t.caller = u.username AND DATE(t.date) BETWEEN ? AND ?) as total
        FROM users u
        WHERE u.role = 'user'
        HAVING total > 0
        ORDER BY u.username
      `, [testCase.start, testCase.end]);
      
      if (results.length > 0) {
        console.table(results);
      } else {
        console.log('No tickets found in this date range.');
      }
    }
    
    await pool.end();
    console.log('\n✅ All date range tests complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMultipleDateRanges();
