import pool from "../../config/database.js"

export const updateLicense = async (req, res) => {
  try {
    const { id } = req.params
    const {
      license_key,
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
      admin_sections
    } = req.body

    // Check if license exists
    const [existing] = await pool.query(
      "SELECT id FROM licenses WHERE id = ?",
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found"
      })
    }

    // Check if license key is being changed and if it already exists
    if (license_key) {
      const [duplicate] = await pool.query(
        "SELECT id FROM licenses WHERE license_key = ? AND id != ?",
        [license_key, id]
      )

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: "License key already exists"
        })
      }
    }

    // Build update query dynamically
    const updates = []
    const values = []

    if (license_key !== undefined) {
      updates.push("license_key = ?")
      values.push(license_key)
    }
    if (admin_name !== undefined) {
      updates.push("admin_name = ?")
      values.push(admin_name)
    }
    if (company_name !== undefined) {
      updates.push("company_name = ?")
      values.push(company_name)
    }
    if (phone !== undefined) {
      updates.push("phone = ?")
      values.push(phone)
    }
    if (email !== undefined) {
      updates.push("email = ?")
      values.push(email)
    }
    if (address !== undefined) {
      updates.push("address = ?")
      values.push(address)
    }
    if (city !== undefined) {
      updates.push("city = ?")
      values.push(city)
    }
    if (country !== undefined) {
      updates.push("country = ?")
      values.push(country)
    }
    if (license_type !== undefined) {
      updates.push("license_type = ?")
      values.push(license_type)
    }
    if (start_date !== undefined) {
      updates.push("start_date = ?")
      values.push(start_date)
    }
    if (expiry_date !== undefined) {
      updates.push("expiry_date = ?")
      values.push(expiry_date)
    }
    if (max_users !== undefined) {
      updates.push("max_users = ?")
      values.push(max_users)
    }
    if (max_counters !== undefined) {
      updates.push("max_counters = ?")
      values.push(max_counters)
    }
    if (status !== undefined) {
      updates.push("status = ?")
      values.push(status)
    }
    if (admin_sections !== undefined) {
      updates.push("admin_sections = ?")
      values.push(JSON.stringify(admin_sections))
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      })
    }

    updates.push("updated_at = NOW()")
    values.push(id)

    const query = `UPDATE licenses SET ${updates.join(", ")} WHERE id = ?`
    await pool.query(query, values)

    res.status(200).json({
      success: true,
      message: "License updated successfully"
    })
  } catch (error) {
    console.error("Update license error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to update license",
      error: error.message 
    })
  }
}
