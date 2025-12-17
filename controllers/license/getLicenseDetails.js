import pool from "../../config/database.js"

export const getLicenseDetails = async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    // Get user's admin_id if user is an admin
    let adminId = userId
    if (userRole === 'user') {
      // For regular users, get their admin_id from users table
      const [users] = await pool.query(
        'SELECT admin_id FROM users WHERE id = ?',
        [userId]
      )
      if (users.length === 0 || !users[0].admin_id) {
        return res.status(404).json({
          success: false,
          message: "User not associated with any admin"
        })
      }
      adminId = users[0].admin_id
    }

    // Get license details
    const [licenses] = await pool.query(
      `SELECT 
        license_key,
        company_name,
        max_users as userLimit,
        status as isActive,
        start_date as issueDate,
        expiry_date as expiryDate
      FROM licenses 
      WHERE admin_id = ?`,
      [adminId]
    )

    if (licenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No license found"
      })
    }

    const license = licenses[0]

    // Get current user count for this admin
    const [userCount] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND status = "active"',
      [adminId]
    )

    // Format response
    const licenseDetails = {
      licenseKey: license.license_key,
      companyName: license.company_name,
      userLimit: license.userLimit || -1,
      currentUserCount: userCount[0].count || 0,
      isActive: license.isActive === 'active',
      issueDate: license.issueDate,
      expiryDate: license.expiryDate
    }

    res.status(200).json(licenseDetails)
  } catch (error) {
    console.error("Get license details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch license details",
      error: error.message
    })
  }
}
