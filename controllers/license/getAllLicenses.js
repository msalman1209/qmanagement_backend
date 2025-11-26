import pool from "../../config/database.js"

export const getAllLicenses = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        license_key,
        admin_id,
        admin_name,
        company_name,
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
        status,
        created_at,
        updated_at,
        CASE 
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN DATEDIFF(expiry_date, CURDATE()) <= 7 THEN 'expiring_soon'
          ELSE 'active'
        END as license_status,
        DATEDIFF(expiry_date, CURDATE()) as days_remaining
      FROM licenses
      ORDER BY created_at DESC
    `

    const [licenses] = await pool.query(query)

    res.status(200).json({
      success: true,
      count: licenses.length,
      data: licenses
    })
  } catch (error) {
    console.error("Get all licenses error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch licenses",
      error: error.message 
    })
  }
}
