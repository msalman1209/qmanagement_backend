import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const createUser = async (req, res) => {
  const { username, email, password, role, admin_id: bodyAdminId, status, permissions } = req.body

  console.log('🔍 [CREATE USER] Request received:', { username, email, role, bodyAdminId, permissions, requestedBy: req.user?.username });

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" })
  }

  // Decide which admin owns this user
  let adminIdToUse = null
  if (req.user?.role === "admin") {
    // Use admin_id for users with admin permissions, otherwise use user's own id
    adminIdToUse = req.user.admin_id || req.user.id
  } else if (req.user?.role === "super_admin" && bodyAdminId) {
    adminIdToUse = bodyAdminId
  }

  console.log('🔍 [CREATE USER] Admin ID to use:', adminIdToUse);

  // Set role - default to 'user'
  const userRole = role || 'user'

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // 🔒 Check license limits before creating user
    if (adminIdToUse) {
      console.log('🔍 [LICENSE CHECK] Checking license for admin:', adminIdToUse);
      
      // Get license information for the admin
      const [licenses] = await connection.query(
        "SELECT max_users, max_receptionists FROM licenses WHERE admin_id = ? AND status = 'active'",
        [adminIdToUse]
      )

      console.log('🔍 [LICENSE CHECK] License found:', licenses.length > 0 ? licenses[0] : 'NONE');

      if (licenses.length === 0) {
        await connection.rollback()
        console.log('❌ [LICENSE CHECK] No active license found');
        return res.status(404).json({
          success: false,
          message: "No active license found for this admin. Please contact tech support."
        })
      }

      const license = licenses[0]

      // Check limits based on role
      if (userRole === 'user') {
        const maxUsers = license.max_users || 10

        // Count current users with role 'user'
        const [currentUsers] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'user'",
          [adminIdToUse]
        )

        const currentCount = currentUsers[0].count;
        console.log(`🔍 [LICENSE CHECK] Users: ${currentCount}/${maxUsers}`);

        if (currentCount >= maxUsers) {
          await connection.rollback()
          console.log(`❌ [LICENSE CHECK] User limit reached! Blocking creation.`);
          return res.status(400).json({
            success: false,
            message: `Maximum users limit reached (${maxUsers}/${maxUsers}). Please contact tech support to upgrade your license.`
          })
        }
        console.log(`✅ [LICENSE CHECK] User limit OK. Proceeding...`);
      } else if (userRole === 'receptionist') {
        const maxReceptionists = license.max_receptionists || 5

        // Count current receptionists
        const [currentReceptionists] = await connection.query(
          "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'receptionist'",
          [adminIdToUse]
        )

        const currentCount = currentReceptionists[0].count;
        console.log(`🔍 [LICENSE CHECK] Receptionists: ${currentCount}/${maxReceptionists}`);

        if (currentCount >= maxReceptionists) {
          await connection.rollback()
          console.log(`❌ [LICENSE CHECK] Receptionist limit reached! Blocking creation.`);
          return res.status(400).json({
            success: false,
            message: `Maximum receptionists limit reached (${maxReceptionists}/${maxReceptionists}). Please contact tech support to upgrade your license.`
          })
        }
        console.log(`✅ [LICENSE CHECK] Receptionist limit OK. Proceeding...`);
      }
    } else {
      console.log('⚠️  [LICENSE CHECK] No admin ID - skipping license check');
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    console.log('✅ [CREATE USER] All checks passed. Creating user...');

    // Prepare permissions JSON
    const permissionsJson = permissions ? JSON.stringify(permissions) : null;

    await connection.query(
      "INSERT INTO users (username, email, password, role, admin_id, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, email, hashedPassword, userRole, adminIdToUse, status || "active", permissionsJson]
    )

    await connection.commit()
    console.log('✅ [CREATE USER] User created successfully:', username);
    res.status(201).json({ success: true, message: "User created successfully" })
  } catch (error) {
    await connection.rollback()
    console.error('❌ [CREATE USER] Error:', error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Username or email already exists" })
    }
    console.error("Create user error:", error)
    res.status(500).json({ success: false, message: "Failed to create user" })
  } finally {
    connection.release()
  }
}
