import pool from './config/database.js';
import bcryptjs from 'bcryptjs';

/**
 * Simulate actual createUser controller logic
 * This mimics what happens when frontend calls POST /admin/users
 */

async function simulateUserCreation() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 SIMULATING: POST /admin/users API Call\n');
    console.log('═'.repeat(80));

    // Simulate request body
    const req = {
      body: {
        username: 'test_user_10',
        email: 'testuser10@gmail.com',
        password: 'test123',
        role: 'user',
        admin_id: 8,
        status: 'active'
      },
      user: {
        id: 8,
        role: 'admin',
        username: 'salman'
      }
    };

    console.log('📨 Request Body:', req.body);
    console.log('👤 Requested by:', req.user.username, `(${req.user.role})`);
    console.log('\n' + '─'.repeat(80));

    const { username, email, password, role, admin_id: bodyAdminId, status } = req.body;

    // Validation
    if (!username || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return;
    }

    // Decide admin ID
    let adminIdToUse = null;
    if (req.user?.role === "admin") {
      adminIdToUse = req.user.id;
    } else if (req.user?.role === "super_admin" && bodyAdminId) {
      adminIdToUse = bodyAdminId;
    }

    console.log('\n🔍 Step 1: Determined admin_id =', adminIdToUse);

    const userRole = role || 'user';
    console.log('🔍 Step 2: User role =', userRole);

    // Begin transaction
    await connection.beginTransaction();
    console.log('🔄 Step 3: Transaction started');

    // License check
    if (adminIdToUse) {
      console.log('\n🔒 Step 4: LICENSE VALIDATION');
      console.log('─'.repeat(80));

      const [licenses] = await connection.query(
        "SELECT max_users, max_receptionists FROM licenses WHERE admin_id = ? AND status = 'active'",
        [adminIdToUse]
      );

      console.log(`   Querying licenses for admin_id: ${adminIdToUse}`);
      console.log(`   License found:`, licenses.length > 0 ? 'YES' : 'NO');

      if (licenses.length === 0) {
        await connection.rollback();
        console.log('\n❌ BLOCKED: No active license found');
        return;
      }

      const license = licenses[0];
      console.log(`   License details: max_users=${license.max_users}, max_receptionists=${license.max_receptionists}`);

      if (userRole === 'user') {
        const maxUsers = license.max_users || 10;
        console.log(`\n   Checking USERS limit: max_users=${maxUsers}`);

        const [currentUsers] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
          [adminIdToUse]
        );

        const currentCount = currentUsers[0].count;
        console.log(`   Current count: ${currentCount}`);
        console.log(`   Validation: ${currentCount} >= ${maxUsers}?`);

        if (currentCount >= maxUsers) {
          await connection.rollback();
          console.log(`\n❌ BLOCKED! User limit reached!`);
          console.log('─'.repeat(80));
          console.log('📛 API Response:');
          console.log(JSON.stringify({
            success: false,
            message: `Maximum users limit reached (${maxUsers}/${maxUsers}). Please contact tech support to upgrade your license.`
          }, null, 2));
          console.log('─'.repeat(80));
          console.log('\n✅ VALIDATION WORKING! User creation prevented! 🎉');
          return;
        }

        console.log(`   ✅ Validation passed: ${currentCount} < ${maxUsers}`);
      }
    }

    // Would create user here
    console.log('\n✅ Step 5: All checks passed. User would be created.');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Admin ID: ${adminIdToUse}`);

    await connection.rollback(); // Don't actually create for test
    console.log('\n🧹 Transaction rolled back (test mode)');

  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

simulateUserCreation();
