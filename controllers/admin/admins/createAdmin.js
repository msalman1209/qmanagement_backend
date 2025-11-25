import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const createAdmin = async (req, res) => {
  // Check if current user is super admin
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Only super admins can create other admins" 
    })
  }

  const { 
    username, 
    email, 
    password, 
    licenseStartDate, 
    licenseEndDate,
    role = "admin",
    status = "active",
    maxUsers = 10,
    maxCounters = 10,
    permissions = {}
  } = req.body

  // Validate required fields
  if (!username || !email || !password || !licenseStartDate || !licenseEndDate) {
    return res.status(400).json({ 
      success: false, 
      message: "Username, email, password, and license dates are required" 
    })
  }

  // Validate license dates
  const startDate = new Date(licenseStartDate)
  const endDate = new Date(licenseEndDate)
  
  if (endDate <= startDate) {
    return res.status(400).json({ 
      success: false, 
      message: "License end date must be after start date" 
    })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Check for duplicate username or email
    const [existing] = await connection.query(
      "SELECT id FROM admin WHERE username = ? OR email = ?",
      [username, email]
    )

    if (existing.length > 0) {
      await connection.rollback()
      return res.status(409).json({ 
        success: false, 
        message: "Username or email already exists" 
      })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Insert admin
    const [result] = await connection.query(
      `INSERT INTO admin (
        username, email, password, role, status, 
        license_start_date, license_end_date, max_users, max_counters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role, status, licenseStartDate, licenseEndDate, maxUsers, maxCounters]
    )

    const adminId = result.insertId

    // Insert permissions
    const {
      manage_users = false,
      manage_services = false,
      view_reports = false,
      manage_configuration = false
    } = permissions

    await connection.query(
      `INSERT INTO admin_permissions (
        admin_id, manage_users, manage_services, view_reports, manage_configuration
      ) VALUES (?, ?, ?, ?, ?)`,
      [adminId, manage_users, manage_services, view_reports, manage_configuration]
    )

    await connection.commit()

    // Return created admin without password
    const [createdAdmin] = await connection.query(
      `SELECT id, username, email, role, status, license_start_date, license_end_date, 
       max_users, max_counters, created_at FROM admin WHERE id = ?`,
      [adminId]
    )

    res.status(201).json({ 
      success: true, 
      message: "Admin created successfully",
      admin: createdAdmin[0]
    })
  } catch (error) {
    await connection.rollback()
    console.error("Create admin error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to create admin" 
    })
  } finally {
    connection.release()
  }
}
