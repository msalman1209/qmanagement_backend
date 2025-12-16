import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"
import { createAdminSession } from "./sessionManager.js"
import { logActivity } from "../../routes/activityLogs.js"

export const adminLogin = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" })
  }

  const connection = await pool.getConnection()
  try {
    // Check in admin table with role 'admin'
    const [admins] = await connection.query(
      "SELECT * FROM admin WHERE email = ? AND role = 'admin'",
      [email]
    )

    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const admin = admins[0]
    
    // ✅ Strict role validation - only 'admin' role allowed
    if (admin.role !== 'admin') {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }
    
    const passwordMatch = await bcryptjs.compare(password, admin.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Check license before allowing login
    const { verifyAdminLicense } = await import('../../utils/licenseUtils.js')
    const licenseCheck = await verifyAdminLicense(admin.id)
    
    if (!licenseCheck.valid) {
      return res.status(403).json({
        success: false,
        message: licenseCheck.message || "Your license has expired or is invalid",
        license_expired: true,
        license_info: licenseCheck.license
      })
    }

    // License is valid but might be expiring soon
    if (licenseCheck.daysRemaining <= 7 && licenseCheck.daysRemaining > 0) {
      console.log(`⚠️ License expiring soon for admin ${admin.id}: ${licenseCheck.daysRemaining} days remaining`)
    }

    // Create session in database
    const deviceInfo = req.headers['user-agent'] || 'Unknown'
    const ipAddress = req.ip || req.connection.remoteAddress
    const sessionResult = await createAdminSession(
      admin.id,
      admin.username,
      'admin',
      deviceInfo,
      ipAddress
    )

    if (!sessionResult.success) {
      return res.status(500).json({ success: false, message: "Failed to create session" })
    }

    // Log login activity
    await logActivity(
      admin.id,
      admin.id,
      'admin',
      'LOGIN',
      `Admin ${admin.username} logged in successfully`,
      {
        email: admin.email,
        device_info: deviceInfo,
        ip_address: ipAddress
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    res.json({
      success: true,
      token: sessionResult.token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: "admin",
      },
    })
  } finally {
    connection.release()
  }
}
