import pool from "../../../config/database.js"

export const getAllUsers = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { adminId } = req.query

    let query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.status, 
        u.admin_id, 
        u.role,
        u.permissions,
        CASE WHEN us.session_id IS NOT NULL THEN 1 ELSE 0 END as isLoggedIn,
        us.last_activity as lastActivity
      FROM users u
      LEFT JOIN user_sessions us ON u.id = us.user_id
    `
    const params = []

    if (adminId) {
      query += " WHERE u.admin_id = ?"
      params.push(adminId)
    } else if (req.user?.role === "admin") {
      // Use admin_id for users with admin permissions, otherwise use user's own id
      const effectiveAdminId = req.user.admin_id || req.user.id;
      query += " WHERE u.admin_id = ?"
      params.push(effectiveAdminId)
    }

    const [users] = await connection.query(query, params)

    // Parse permissions JSON for each user
    const usersWithParsedPermissions = users.map(user => {
      let parsedPermissions = null;
      if (user.permissions) {
        try {
          parsedPermissions = typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : user.permissions;
        } catch (e) {
          console.error(`Failed to parse permissions for user ${user.id}:`, e);
          parsedPermissions = null;
        }
      }
      return {
        ...user,
        permissions: parsedPermissions
      };
    });

    res.json({ success: true, users: usersWithParsedPermissions })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ success: false, message: "Failed to retrieve users" })
  } finally {
    connection.release()
  }
}
