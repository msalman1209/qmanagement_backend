import pool from '../config/database.js';
import bcryptjs from 'bcryptjs';

async function hashPlaintextPasswords() {
  const connection = await pool.getConnection();
  try {
    // Find users with plaintext passwords (not starting with $2)
    const [users] = await connection.query(
      "SELECT id, username, email, password FROM users WHERE password NOT LIKE '$2%'"
    );
    
    if (users.length === 0) {
      console.log('✅ All passwords are already hashed!');
      return;
    }
    
    console.log(`\n🔍 Found ${users.length} users with plaintext passwords:\n`);
    users.forEach(u => console.log(`  - ${u.username} (${u.email}) - password: ${u.password}`));
    
    console.log('\n🔐 Hashing passwords...\n');
    
    for (const user of users) {
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log(`✅ Hashed password for ${user.username}`);
    }
    
    console.log('\n✅ All passwords have been hashed successfully!');
    console.log('\n📋 Users can now login with their original passwords.\n');
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

hashPlaintextPasswords();
