import pool from "../../config/database.js"

export const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        l.id,
        l.license_key,
        l.admin_id,
        l.admin_name,
        l.company_name,
        l.company_logo,
        l.phone,
        l.email,
        l.address,
        l.city,
        l.country,
        l.license_type,
        l.start_date,
        l.expiry_date,
        l.max_users,
        l.max_counters,
        l.max_services,
        l.features,
        l.status,
        l.created_at,
        l.updated_at,
        a.username as admin_username,
        a.email as admin_email,
        a.status as admin_status,
        CASE 
          WHEN l.expiry_date < CURDATE() THEN 'expired'
          WHEN DATEDIFF(l.expiry_date, CURDATE()) <= 7 THEN 'expiring_soon'
          ELSE 'active'
        END as license_status,
        DATEDIFF(l.expiry_date, CURDATE()) as days_remaining,
        (SELECT COUNT(*) FROM users WHERE admin_id = l.admin_id) as current_users,
        (SELECT COUNT(*) FROM services WHERE admin_id = l.admin_id) as current_services
      FROM licenses l
      LEFT JOIN admin a ON l.admin_id = a.id
      WHERE l.id = ?
    `

    const [licenses] = await pool.query(query, [id])

    if (licenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found"
      })
    }

    const license = licenses[0]
    
    // Parse features JSON if it exists
    if (license.features) {
      try {
        license.features = JSON.parse(license.features)
      } catch (e) {
        license.features = []
      }
    }

    // Calculate usage percentages
    license.user_usage_percentage = license.max_users > 0 
      ? Math.round((license.current_users / license.max_users) * 100) 
      : 0
    
    license.service_usage_percentage = license.max_services > 0 
      ? Math.round((license.current_services / license.max_services) * 100) 
      : 0

    res.status(200).json({
      success: true,
      data: license
    })
  } catch (error) {
    console.error("Get license by ID error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch license",
      error: error.message 
    })
  }
}
