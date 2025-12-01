import pool from "../../config/database.js"

export const getLicenseReport = async (req, res) => {
  try {
    // Get statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_licenses,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_licenses,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_licenses,
        SUM(CASE WHEN expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired_licenses,
        SUM(CASE WHEN DATEDIFF(expiry_date, CURDATE()) <= 7 AND expiry_date >= CURDATE() THEN 1 ELSE 0 END) as expiring_soon
      FROM licenses
    `)

    // Get license distribution by type
    const [byType] = await pool.query(`
      SELECT 
        license_type,
        COUNT(*) as count
      FROM licenses
      GROUP BY license_type
    `)

    // Get recent licenses
    const [recentLicenses] = await pool.query(`
      SELECT 
        id,
        license_key,
        admin_id,
        admin_name,
        company_name,
        company_logo,
        phone,
        email,
        address,
        city,
        country,
        license_type,
        start_date,
        expiry_date,
        max_users,
        max_counters,
        max_services,
        status,
        created_at,
        CASE 
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN DATEDIFF(expiry_date, CURDATE()) <= 7 THEN 'expiring_soon'
          ELSE 'active'
        END as license_status,
        DATEDIFF(expiry_date, CURDATE()) as days_remaining
      FROM licenses
      ORDER BY created_at DESC
      LIMIT 10
    `)

    // Get expiring licenses
    const [expiringLicenses] = await pool.query(`
      SELECT 
        id,
        license_key,
        admin_name,
        company_name,
        expiry_date,
        DATEDIFF(expiry_date, CURDATE()) as days_remaining
      FROM licenses
      WHERE expiry_date >= CURDATE() AND DATEDIFF(expiry_date, CURDATE()) <= 30
      ORDER BY expiry_date ASC
    `)

    res.status(200).json({
      success: true,
      data: {
        statistics: stats[0],
        licensesByType: byType,
        recentLicenses: recentLicenses,
        expiringLicenses: expiringLicenses
      }
    })
  } catch (error) {
    console.error("Get license report error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch license report",
      error: error.message 
    })
  }
}
