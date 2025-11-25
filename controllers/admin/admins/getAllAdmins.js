import pool from "../../../config/database.js"

export const getAllAdmins = async (req, res) => {
  // Check if current user is super admin
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Only super admins can view all admins" 
    })
  }

  const connection = await pool.getConnection()
  try {
    // Get all admins with their permissions
    const [admins] = await connection.query(
      `SELECT 
        a.id, a.username, a.email, a.role, a.status, 
        a.license_start_date, a.license_end_date, 
        a.max_users, a.max_counters, a.created_at,
        p.manage_users, p.manage_services, p.view_reports, p.manage_configuration
      FROM admin a
      LEFT JOIN admin_permissions p ON a.id = p.admin_id
      WHERE a.role IN ('admin', 'super_admin')
      ORDER BY a.created_at DESC`
    )

    res.json({ 
      success: true, 
      admins,
      total: admins.length 
    })
  } catch (error) {
    console.error("Get all admins error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve admins" 
    })
  } finally {
    connection.release()
  }
}
