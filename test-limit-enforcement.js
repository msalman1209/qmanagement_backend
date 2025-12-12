import pool from './config/database.js';
import bcryptjs from 'bcryptjs';

/**
 * 🧪 Practical Test: Try to Exceed License Limits
 * 
 * This script demonstrates what happens when you try to create
 * more users than the license allows
 */

async function testLimitExceeding() {
  const connection = await pool.getConnection();

  try {
    console.log('🧪 Testing License Limit Enforcement\n');
    console.log('═'.repeat(70));

    // Get an admin with license
    const [admins] = await connection.query(
      `SELECT a.id, a.username, 
              l.max_users, l.max_receptionists, l.max_ticket_info_users
       FROM admin a
       JOIN licenses l ON l.admin_id = a.id
       WHERE a.role = 'admin' AND l.status = 'active'
       LIMIT 1`
    );

    if (admins.length === 0) {
      console.log('❌ No admin found');
      return;
    }

    const admin = admins[0];
    console.log(`\n📋 Testing with Admin: ${admin.username} (ID: ${admin.id})`);
    console.log(`   Max Users: ${admin.max_users}`);
    console.log(`   Max Receptionists: ${admin.max_receptionists}`);
    console.log(`   Max Ticket Info: ${admin.max_ticket_info_users}`);

    // Get current counts
    const [userCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
      [admin.id]
    );

    const [receptionistCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'receptionist'",
      [admin.id]
    );

    const [ticketInfoCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'ticket_info'",
      [admin.id]
    );

    console.log('\n📊 Current Counts:');
    console.log(`   Users: ${userCount[0].count}/${admin.max_users}`);
    console.log(`   Receptionists: ${receptionistCount[0].count}/${admin.max_receptionists}`);
    console.log(`   Ticket Info: ${ticketInfoCount[0].count}/${admin.max_ticket_info_users}`);
    console.log('═'.repeat(70));

    // TEST 1: Try to create user
    console.log('\n\n🧪 TEST 1: Creating Regular User');
    console.log('─'.repeat(70));
    await testUserCreation(connection, admin, 'user', admin.max_users, userCount[0].count);

    // TEST 2: Try to create receptionist
    console.log('\n\n🧪 TEST 2: Creating Receptionist');
    console.log('─'.repeat(70));
    await testUserCreation(connection, admin, 'receptionist', admin.max_receptionists, receptionistCount[0].count);

    // TEST 3: Try to create ticket_info user
    console.log('\n\n🧪 TEST 3: Creating Ticket Info User');
    console.log('─'.repeat(70));
    await testTicketInfoCreation(connection, admin, admin.max_ticket_info_users, ticketInfoCount[0].count);

    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ All Tests Complete!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

async function testUserCreation(connection, admin, role, maxLimit, currentCount) {
  try {
    await connection.beginTransaction();

    console.log(`\n📝 Attempting to create ${role}...`);
    console.log(`   Current: ${currentCount}/${maxLimit}`);

    // Check if limit reached
    if (currentCount >= maxLimit) {
      console.log(`   ❌ LIMIT REACHED! Cannot create more.`);
      console.log(`   💬 Error: "Maximum ${role}s limit reached (${maxLimit}/${maxLimit}).`);
      console.log(`            Please contact tech support to upgrade your license."`);
      await connection.rollback();
      return;
    }

    // Try to create
    const testUsername = `test_${role}_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    const testPassword = await bcryptjs.hash('test123', 10);

    await connection.query(
      "INSERT INTO users (username, email, password, role, admin_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [testUsername, testEmail, testPassword, role, admin.id, 'active']
    );

    await connection.commit();
    console.log(`   ✅ SUCCESS! ${role} created: ${testUsername}`);
    console.log(`   📊 New count: ${currentCount + 1}/${maxLimit}`);

    // Clean up test user
    await connection.query("DELETE FROM users WHERE username = ?", [testUsername]);
    console.log(`   🧹 Test user cleaned up`);

  } catch (error) {
    await connection.rollback();
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

async function testTicketInfoCreation(connection, admin, maxLimit, currentCount) {
  try {
    await connection.beginTransaction();

    console.log(`\n📝 Attempting to create ticket_info user...`);
    console.log(`   Current: ${currentCount}/${maxLimit}`);

    // Check if limit reached
    if (currentCount >= maxLimit) {
      console.log(`   ❌ LIMIT REACHED! Cannot create more.`);
      console.log(`   💬 Error: "Maximum ticket info users limit reached (${maxLimit}/${maxLimit}).`);
      console.log(`            Please contact tech support to upgrade your license."`);
      await connection.rollback();
      return;
    }

    // Try to create
    const testUsername = `test_ticketinfo_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    const testPassword = await bcryptjs.hash('test123', 10);

    await connection.query(
      "INSERT INTO users (username, email, password, role, admin_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [testUsername, testEmail, testPassword, 'ticket_info', admin.id, 'active']
    );

    await connection.commit();
    console.log(`   ✅ SUCCESS! ticket_info created: ${testUsername}`);
    console.log(`   📊 New count: ${currentCount + 1}/${maxLimit}`);

    // Clean up test user
    await connection.query("DELETE FROM users WHERE username = ?", [testUsername]);
    console.log(`   🧹 Test user cleaned up`);

  } catch (error) {
    await connection.rollback();
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

// Run test
testLimitExceeding();
