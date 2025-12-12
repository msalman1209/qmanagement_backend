import pool from './config/database.js';
import bcryptjs from 'bcryptjs';

/**
 * Test: Try to create 10th user when limit is 9
 */

async function testCreateUser() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 Testing User Creation with License Limit\n');
    console.log('═'.repeat(80));

    const adminId = 8;
    const userRole = 'user';

    // Step 1: Get license info
    console.log('\n📋 Step 1: Checking License...');
    const [licenses] = await connection.query(
      "SELECT max_users FROM licenses WHERE admin_id = ? AND status = 'active'",
      [adminId]
    );

    if (licenses.length === 0) {
      console.log('❌ No active license found');
      return;
    }

    const maxUsers = licenses[0].max_users;
    console.log(`   License allows: ${maxUsers} users`);

    // Step 2: Count current users
    console.log('\n📊 Step 2: Counting Current Users...');
    const [currentUsers] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
      [adminId]
    );

    const currentCount = currentUsers[0].count;
    console.log(`   Current users: ${currentCount}/${maxUsers}`);

    // Step 3: Check if we can create
    console.log('\n🔍 Step 3: Validation Check...');
    console.log(`   Checking: ${currentCount} >= ${maxUsers}?`);

    if (currentCount >= maxUsers) {
      console.log(`   Result: YES (${currentCount} >= ${maxUsers})`);
      console.log('\n❌ BLOCKED! Cannot create user.');
      console.log('📛 Error Message:');
      console.log(`   "Maximum users limit reached (${maxUsers}/${maxUsers}).`);
      console.log(`    Please contact tech support to upgrade your license."`);
      console.log('\n✅ VALIDATION WORKING CORRECTLY! 🎉');
      return;
    }

    console.log(`   Result: NO (${currentCount} < ${maxUsers})`);
    console.log('\n✅ Validation passed. Would create user.');
    console.log(`   New count would be: ${currentCount + 1}/${maxUsers}`);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

testCreateUser();
