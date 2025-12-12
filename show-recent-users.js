import pool from './config/database.js';

async function showRecentUsers() {
  try {
    const [users] = await pool.query(`
      SELECT id, username, email, role, admin_id, created_at 
      FROM users 
      WHERE admin_id = 8 AND role = 'user' 
      ORDER BY created_at DESC
    `);

    console.log('\n📋 Recent Users for Admin ID 8 (salman):');
    console.log('═'.repeat(80));
    console.table(users);
    console.log(`\nTotal: ${users.length} users`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

showRecentUsers();
