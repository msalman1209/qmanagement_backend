import pool from './config/database.js';

(async () => {
  try {
    // Check users table structure
    const [columns] = await pool.query("SHOW COLUMNS FROM users WHERE Field = 'username'");
    
    console.log('Username Column Info:');
    console.log(JSON.stringify(columns[0], null, 2));
    
    // Check indexes on users table
    const [indexes] = await pool.query("SHOW INDEX FROM users WHERE Column_name = 'username'");
    
    console.log('\nUsername Indexes:');
    if (indexes.length === 0) {
      console.log('❌ No unique index on username!');
      console.log('\n🔧 Creating unique index on username column...');
      
      // Add unique constraint
      await pool.query("ALTER TABLE users ADD UNIQUE KEY unique_username (username)");
      console.log('✅ Unique constraint added to username column!');
    } else {
      console.log('✅ Username already has unique constraint:');
      console.log(JSON.stringify(indexes, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
