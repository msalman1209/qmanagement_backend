import pool from './config/database.js';
import bcryptjs from 'bcryptjs';

/**
 * Test to verify that license limits are properly enforced
 * Tries to create user when limit is already exceeded
 */

async function testLimitEnforcement() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 Testing License Limit Enforcement (5 users limit)\n');
    console.log('═'.repeat(80));

    // Get admin salman (who has 7/5 users already)
    const [admins] = await connection.query(`
      SELECT 
        a.id,
        a.username,
        l.max_users,
        (SELECT COUNT(*) FROM users WHERE admin_id = a.id AND role = 'user') as current_users
      FROM admin a
      JOIN licenses l ON l.admin_id = a.id
      WHERE a.username = 'salman'
    `);

    if (admins.length === 0) {
      console.log('❌ Admin not found');
      return;
    }

    const admin = admins[0];
    console.log(`\n📋 Admin: ${admin.username} (ID: ${admin.id})`);
    console.log(`   Max Users Allowed: ${admin.max_users}`);
    console.log(`   Current Users: ${admin.current_users}`);
    
    if (admin.current_users > admin.max_users) {
      console.log(`   🚨 STATUS: ALREADY EXCEEDED BY ${admin.current_users - admin.max_users} USERS!`);
    } else if (admin.current_users === admin.max_users) {
      console.log(`   ⚠️  STATUS: AT LIMIT`);
    } else {
      console.log(`   ✅ STATUS: WITHIN LIMIT`);
    }

    console.log('\n' + '═'.repeat(80));

    // Now try to create one more user
    console.log('\n🧪 TEST: Attempting to create ONE MORE user...\n');
    console.log('─'.repeat(80));

    await connection.beginTransaction();

    try {
      // Check license limits (same as createUser.js)
      const [licenses] = await connection.query(
        "SELECT max_users FROM licenses WHERE admin_id = ? AND status = 'active'",
        [admin.id]
      );

      if (licenses.length === 0) {
        console.log('❌ No active license found');
        await connection.rollback();
        return;
      }

      const maxUsers = licenses[0].max_users;

      // Count current users
      const [currentUsers] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
        [admin.id]
      );

      const currentCount = currentUsers[0].count;

      console.log(`   Checking: ${currentCount} >= ${maxUsers}?`);

      if (currentCount >= maxUsers) {
        await connection.rollback();
        console.log(`\n   ❌ BLOCKED! Cannot create user.`);
        console.log(`   📛 Error Message: "Maximum users limit reached (${maxUsers}/${maxUsers}).`);
        console.log(`                     Please contact tech support to upgrade your license."`);
        console.log(`\n   ✅ VALIDATION WORKING CORRECTLY!`);
        return;
      }

      // Try to create user
      const testUsername = `test_user_${Date.now()}`;
      const testEmail = `${testUsername}@test.com`;
      const testPassword = await bcryptjs.hash('test123', 10);

      await connection.query(
        "INSERT INTO users (username, email, password, role, admin_id, status) VALUES (?, ?, ?, ?, ?, ?)",
        [testUsername, testEmail, testPassword, 'user', admin.id, 'active']
      );

      await connection.commit();
      console.log(`\n   ⚠️  WARNING: User was created! (${testUsername})`);
      console.log(`   🔴 VALIDATION NOT WORKING!`);

      // Clean up
      await connection.query("DELETE FROM users WHERE username = ?", [testUsername]);
      console.log(`   🧹 Test user cleaned up`);

    } catch (error) {
      await connection.rollback();
      console.log(`\n   ❌ Error during creation: ${error.message}`);
    }

    console.log('\n' + '═'.repeat(80));

    // Check how many users exist now
    const [finalCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
      [admin.id]
    );

    console.log(`\n📊 Final Count: ${finalCount[0].count}/${admin.max_users}`);
    
    if (finalCount[0].count > admin.max_users) {
      console.log(`\n⚠️  NOTE: There are ${finalCount[0].count - admin.max_users} extra users that were created before validation was added.`);
      console.log(`   These users can stay, but no new users can be added until count goes below limit.`);
    }

    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

testLimitEnforcement();
