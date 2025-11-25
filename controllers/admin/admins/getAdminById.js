import pool from "../../../config/database.js"

export const getAdminById = async (req, res) => {
  // Check if requester is super admin
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Only super admins can view admin details"
    })
  }

  const { adminId } = req.params

  const connection = await pool.getConnection()
  try {
    // Get admin details (excluding password)
    const [admins] = await connection.query(
      `SELECT 
        id,
        username,
        email,
        role,
        status,
        license_start_date,
        license_end_date,
        max_users,
        max_counters,
        created_at,
        updated_at
      FROM admin 
      WHERE id = ? AND role IN ('admin', 'super_admin')`,
      [adminId]
    )

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      })
    }

    const admin = admins[0]

    // Get permissions
    const [permissions] = await connection.query(
      `SELECT 
        manage_users,
        manage_services,
        view_reports,
        manage_configuration
      FROM admin_permissions 
      WHERE admin_id = ?`,
      [adminId]
    )

    admin.permissions = permissions.length > 0 ? permissions[0] : {
      manage_users: 0,
      manage_services: 0,
      view_reports: 0,
      manage_configuration: 0
    }

    // Get users under this admin
    const [users] = await connection.query(
      `SELECT id, username, email, status, admin_id FROM users WHERE admin_id = ? ORDER BY id DESC`,
      [adminId]
    )
    admin.users = users

    res.status(200).json({
      success: true,
      admin
    })

  } catch (error) {
    console.error("Error getting admin:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve admin"
    })
  } finally {
    connection.release()
  }
}
