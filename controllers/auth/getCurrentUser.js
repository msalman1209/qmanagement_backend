import pool from "../../config/database.js"

export const getCurrentUser = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    let user
    if (req.user.role === "super_admin" || req.user.role === "admin") {
      const [result] = await connection.query(
        "SELECT id, email, username FROM admin WHERE id = ?",
        [req.user.id]
      )
      user = result[0]
    } else {
      const [result] = await connection.query(
        "SELECT id, email, username, admin_id, permissions FROM users WHERE id = ?",
        [req.user.id]
      )
      user = result[0]
      
      // 🔍 Debug: Log permissions being returned
      console.log('📋 [getCurrentUser] User permissions:', {
        id: user.id,
        username: user.username,
        permissions_type: typeof user.permissions,
        permissions_value: user.permissions
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    res.json({ success: true, user: { ...user, role: req.user.role } })
  } finally {
    connection.release()
  }
}
