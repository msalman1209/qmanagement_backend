import pool from "../../config/database.js"

export const getLicenseByAdminId = async (req, res) => {
  try {
    const { adminId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    // Check authorization: admin can only get their own license, super_admin can get any
    if (userRole === 'admin' && parseInt(userId) !== parseInt(adminId)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own license information"
      })
    }

    const [licenses] = await pool.query(
      `SELECT 
        id, license_key, admin_id, admin_name, company_name, company_logo,
        phone, email, address, city, country, license_type, start_date,
        expiry_date, max_users, max_counters, max_services, features, status,
        created_at, updated_at
      FROM licenses 
      WHERE admin_id = ?`,
      [adminId]
    )

    if (licenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found for this admin"
      })
    }

    // Parse features if it's a string
    const license = licenses[0]
    if (typeof license.features === 'string') {
      license.features = JSON.parse(license.features)
    }

    res.status(200).json({
      success: true,
      data: license
    })
  } catch (error) {
    console.error("Get license by admin ID error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch license",
      error: error.message
    })
  }
}
