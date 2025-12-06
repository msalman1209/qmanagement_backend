import pool from "../config/database.js"

const testUserStatusAndSession = async () => {
  const connection = await pool.getConnection()
  
  try {
    console.log("\n🔍 Testing User Status & Session Management\n")
    console.log("=" .repeat(60))

    // Test 1: Check users table structure
    console.log("\n📋 Test 1: Users Table Structure")
    console.log("-".repeat(60))
    const [columns] = await connection.query("SHOW COLUMNS FROM users")
    
    const hasStatus = columns.find(col => col.Field === 'status')
    const hasCreatedAt = columns.find(col => col.Field === 'created_at')
    const hasUpdatedAt = columns.find(col => col.Field === 'updated_at')
    
    console.log("✓ Status column:", hasStatus ? "✅ EXISTS" : "❌ MISSING")
    console.log("✓ Created_at column:", hasCreatedAt ? "✅ EXISTS" : "❌ MISSING")
    console.log("✓ Updated_at column:", hasUpdatedAt ? "✅ EXISTS" : "❌ MISSING")

    if (hasStatus) {
      console.log("\n  Status Type:", hasStatus.Type)
      console.log("  Default Value:", hasStatus.Default || 'active')
    }

    // Test 2: Check all users and their status
    console.log("\n\n📊 Test 2: All Users Status")
    console.log("-".repeat(60))
    const [users] = await connection.query(`
      SELECT 
        id, 
        username, 
        email, 
        status,
        created_at
      FROM users
      ORDER BY id
    `)

    if (users.length === 0) {
      console.log("⚠️  No users found in database")
    } else {
      console.table(users.map(u => ({
        ID: u.id,
        Username: u.username,
        Email: u.email,
        Status: u.status || 'N/A',
        '✓': u.status === 'active' ? '✅' : u.status === 'inactive' ? '❌' : '🚫'
      })))
    }

    // Test 3: Check session configuration
    console.log("\n\n⏰ Test 3: Session Configuration")
    console.log("-".repeat(60))
    
    // Check user_sessions table
    const [sessionColumns] = await connection.query("SHOW COLUMNS FROM user_sessions")
    const hasExpiresAt = sessionColumns.find(col => col.Field === 'expires_at')
    const hasActive = sessionColumns.find(col => col.Field === 'active')
    
    console.log("✓ User Sessions Table:")
    console.log("  - expires_at column:", hasExpiresAt ? "✅ EXISTS" : "❌ MISSING")
    console.log("  - active column:", hasActive ? "✅ EXISTS" : "❌ MISSING")

    // Check admin_sessions table
    const [adminSessionColumns] = await connection.query("SHOW COLUMNS FROM admin_sessions")
    const hasAdminExpiresAt = adminSessionColumns.find(col => col.Field === 'expires_at')
    const hasAdminActive = adminSessionColumns.find(col => col.Field === 'active' || col.Field === 'is_active')
    
    console.log("\n✓ Admin Sessions Table:")
    console.log("  - expires_at column:", hasAdminExpiresAt ? "✅ EXISTS" : "❌ MISSING")
    console.log("  - active column:", hasAdminActive ? "✅ EXISTS" : "❌ MISSING")

    // Test 4: Check active sessions
    console.log("\n\n🔐 Test 4: Active User Sessions")
    console.log("-".repeat(60))
    const [activeSessions] = await connection.query(`
      SELECT 
        us.session_id,
        u.username,
        u.email,
        u.status as user_status,
        us.login_time,
        us.expires_at,
        DATEDIFF(us.expires_at, NOW()) as days_remaining,
        us.active
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.active = 1
      ORDER BY us.login_time DESC
      LIMIT 10
    `)

    if (activeSessions.length === 0) {
      console.log("ℹ️  No active user sessions found")
    } else {
      console.log(`Found ${activeSessions.length} active session(s):`)
      console.table(activeSessions.map(s => ({
        Username: s.username,
        Email: s.email,
        'User Status': s.user_status || 'active',
        'Login Time': s.login_time,
        'Days Remaining': s.days_remaining || 'N/A',
        Active: s.active ? '✅' : '❌'
      })))
    }

    // Test 5: Summary
    console.log("\n\n📈 Test Summary")
    console.log("=" .repeat(60))
    
    const activeUsers = users.filter(u => u.status === 'active' || !u.status).length
    const inactiveUsers = users.filter(u => u.status === 'inactive').length
    const suspendedUsers = users.filter(u => u.status === 'suspended').length

    console.log(`
✅ Database Structure: ${hasStatus && hasExpiresAt ? 'READY' : 'NEEDS MIGRATION'}
📊 Total Users: ${users.length}
   - Active: ${activeUsers} ✅
   - Inactive: ${inactiveUsers} ${inactiveUsers > 0 ? '❌' : ''}
   - Suspended: ${suspendedUsers} ${suspendedUsers > 0 ? '🚫' : ''}
🔐 Active Sessions: ${activeSessions.length}
⏰ Session Duration: 7 days (configured in code)

🎯 Status Check:
${hasStatus ? '✅ Users can be set as inactive/suspended' : '⚠️  Run migration to add status column'}
${hasExpiresAt ? '✅ Sessions expire after 7 days' : '⚠️  Session expiry not configured'}
    `)

    // Test 6: Recommendations
    console.log("\n💡 Recommendations")
    console.log("-".repeat(60))
    
    if (!hasStatus) {
      console.log("⚠️  Run: node backend/database/add-user-status-column.js")
    }
    
    if (inactiveUsers > 0) {
      console.log(`ℹ️  ${inactiveUsers} user(s) are inactive and cannot login`)
    }
    
    if (activeSessions.length > 0) {
      const expiringSoon = activeSessions.filter(s => s.days_remaining <= 2)
      if (expiringSoon.length > 0) {
        console.log(`⚠️  ${expiringSoon.length} session(s) expiring in 2 days or less`)
      }
    }
    
    console.log("\n✅ All tests completed!")
    console.log("=" .repeat(60) + "\n")

  } catch (error) {
    console.error("\n❌ Test Error:", error.message)
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

// Run the test
testUserStatusAndSession()
  .then(() => {
    console.log("🎉 Test suite completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Test suite failed:", error)
    process.exit(1)
  })
