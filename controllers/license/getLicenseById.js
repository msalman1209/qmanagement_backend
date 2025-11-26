import pool from "../../config/database.js"

export const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params

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
      WHERE id = ?
    `

    const [licenses] = await pool.query(query, [id])

    if (licenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found"
      })
    }

    res.status(200).json({
      success: true,
      data: licenses[0]
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
