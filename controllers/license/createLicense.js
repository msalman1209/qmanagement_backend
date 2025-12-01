import pool from "../../config/database.js"
import bcryptjs from "bcryptjs"
import { 
  generateLicenseKey, 
  isValidLicenseKeyFormat,
  getLicenseTypeFeatures,
  calculateExpiryDate 
} from "../../utils/licenseUtils.js"

export const createLicense = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    let {
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
      max_services,
      features,
      status,
      admin_username,
      admin_password
    } = req.body

    // Handle logo upload
    const company_logo = req.file ? `/uploads/licenses/${req.file.filename}` : null

    // Validate required fields
    if (!company_name || !license_type || !admin_username || !admin_password || !email) {
      await connection.rollback()
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: company_name, license_type, admin_username, admin_password, email" 
      })
    }

    // Generate license key if not provided
    if (!license_key) {
      license_key = generateLicenseKey()
    } else {
      // Validate license key format
      if (!isValidLicenseKeyFormat(license_key)) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: "Invalid license key format. Format should be XXXX-XXXX-XXXX-XXXX"
        })
      }
    }

    // Get license type features
    const licenseFeatures = getLicenseTypeFeatures(license_type)
    
    // Set defaults from license type if not provided
    max_users = max_users || licenseFeatures.max_users
    max_counters = max_counters || licenseFeatures.max_counters
    max_services = max_services || licenseFeatures.max_services
    features = features || JSON.stringify(licenseFeatures.features)

    // Set start date to today if not provided
    if (!start_date) {
      start_date = new Date().toISOString().split('T')[0]
    }

    // Calculate expiry date based on license type if not provided
    if (!expiry_date) {
      expiry_date = calculateExpiryDate(start_date, license_type)
    }

    // Validate dates
    const startDateObj = new Date(start_date)
    const expiryDateObj = new Date(expiry_date)
    
    if (expiryDateObj <= startDateObj) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after start date"
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

    // Create admin account with license info
    const adminQuery = `
      INSERT INTO admin (
        username, email, password, role, license_key, license_expiry_date, 
        status, created_at
      ) VALUES (?, ?, ?, 'admin', ?, ?, ?, NOW())
    `

    const [adminResult] = await connection.query(adminQuery, [
      admin_username,
      email,
      hashedPassword,
      license_key,
      expiry_date,
      status || 'active'
    ])

    const newAdminId = adminResult.insertId

    // Insert new license with the newly created admin ID
    const licenseQuery = `
      INSERT INTO licenses (
        license_key, admin_id, admin_name, company_name, company_logo, phone, email, 
        address, city, country, license_type, start_date, expiry_date, 
        max_users, max_counters, max_services, features, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const [licenseResult] = await connection.query(licenseQuery, [
      license_key,
      newAdminId,
      admin_username,
      company_name,
      company_logo,
      phone || null,
      email,
      address || null,
      city || null,
      country || null,
      license_type,
      start_date,
      expiry_date,
      max_users,
      max_counters,
      max_services,
      typeof features === 'string' ? features : JSON.stringify(features),
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
        admin_email: email,
        license_type,
        start_date,
        expiry_date,
        max_users,
        max_counters,
        max_services,
        features: typeof features === 'string' ? JSON.parse(features) : features
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
