import pool from '../config/database.js';

async function checkPasswords() {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query('SELECT id, username, email, password FROM users LIMIT 10');
    
    console.log('\nChecking user passwords format:\n');
    console.table(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      password_start: u.password.substring(0, 20) + '...',
      password_length: u.password.length,
      is_hashed: u.password.startsWith('$2') ? 'YES (bcrypt)' : 'NO (plaintext)'
    })));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkPasswords();
