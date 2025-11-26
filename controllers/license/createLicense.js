import pool from "../../config/database.js"
import bcryptjs from "bcryptjs"

export const createLicense = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    const {
      license_key,
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
      admin_username,
      admin_password
    } = req.body

    // Validate required fields
    if (!license_key || !company_name || !license_type || !start_date || !expiry_date) {
      await connection.rollback()
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      })
    }

    // Validate admin credentials if provided
    if (!admin_username || !admin_password) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Admin username and password are required"
      })
    }

    if (!email) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Email is required"
      })
    }

    // Check if license key already exists
    const [existingLicense] = await connection.query(
      "SELECT license_key FROM licenses WHERE license_key = ?",
      [license_key]
    )

    if (existingLicense.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "License key already exists"
      })
    }

    // Check if admin username already exists
    const [existingAdmin] = await connection.query(
      "SELECT username FROM admin WHERE username = ?",
      [admin_username]
    )

    if (existingAdmin.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Admin username already exists"
      })
    }

    // Check if email already exists
    const [existingEmail] = await connection.query(
      "SELECT email FROM admin WHERE email = ?",
      [email]
    )

    if (existingEmail.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      })
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(admin_password, 10)

    // Create admin account
    const adminQuery = `
      INSERT INTO admin (
        username, email, password, role, created_at
      ) VALUES (?, ?, ?, 'admin', NOW())
    `

    const [adminResult] = await connection.query(adminQuery, [
      admin_username,
      email,
      hashedPassword
    ])

    const newAdminId = adminResult.insertId

    // Insert new license with the newly created admin ID
    const licenseQuery = `
      INSERT INTO licenses (
        license_key, admin_id, admin_name, company_name, phone, email, 
        address, city, country, license_type, start_date, expiry_date, 
        max_users, max_counters, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const [licenseResult] = await connection.query(licenseQuery, [
      license_key,
      newAdminId,
      admin_username,
      company_name,
      phone || null,
      email,
      address || null,
      city || null,
      country || null,
      license_type,
      start_date,
      expiry_date,
      max_users || 10,
      max_counters || 5,
      status || 'active'
    ])

    await connection.commit()

    res.status(201).json({
      success: true,
      message: "License and admin account created successfully",
      data: {
        license_id: licenseResult.insertId,
        license_key,
        admin_id: newAdminId,
        admin_username,
        admin_email: email
      }
    })
  } catch (error) {
    await connection.rollback()
    console.error("Create license error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to create license",
      error: error.message 
    })
  } finally {
    connection.release()
  }
}
