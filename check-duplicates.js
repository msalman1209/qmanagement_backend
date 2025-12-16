import pool from './config/database.js';

try {
  // Check for duplicate IDs
  const [duplicates] = await pool.query(
    `SELECT id, COUNT(*) as count FROM tickets 
     WHERE representative_id = 1 AND calling_user_time IS NOT NULL
     GROUP BY id HAVING COUNT(*) > 1`
  );
  
  console.log('🔍 Duplicate IDs found:', duplicates.length);
  if (duplicates.length > 0) {
    console.log(duplicates);
  }
  
  // Check primary key
  const [pk] = await pool.query(
    `SELECT CONSTRAINT_NAME, COLUMN_NAME 
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_NAME = 'tickets' AND TABLE_SCHEMA = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
    [process.env.DB_NAME]
  );
  
  console.log('\n📋 Primary Key:');
  console.log(pk);
  
  // Get all unique IDs
  const [uniqueIds] = await pool.query(
    `SELECT DISTINCT id FROM tickets 
     WHERE representative_id = 1 AND calling_user_time IS NOT NULL
     ORDER BY id DESC`
  );
  
  console.log(`\n✅ Unique IDs: ${uniqueIds.length}`);
  console.log('First 5:', uniqueIds.slice(0, 5).map(r => r.id));
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
