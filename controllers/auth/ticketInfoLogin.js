import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"
import { createUserSession } from "./sessionManager.js"

export const ticketInfoLogin = async (req, res) => {
  const { email, username, password } = req.body
  const loginIdentifier = email || username;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: "Email/Username and password required" })
  }

  const connection = await pool.getConnection()
  try {
    // Check by email OR username
    const [users] = await connection.query(
      "SELECT * FROM users WHERE (email = ? OR username = ?) AND role = 'ticket_info'", 
      [loginIdentifier, loginIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const user = users[0]
    
    // ✅ Allow any user role to login from ticket-info-login
    const userRole = user.role || 'ticket_info';
    
    const passwordMatch = await bcryptjs.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Check if user account is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: user.status === 'inactive' 
          ? "Your account is inactive. Please contact your administrator." 
          : "Your account has been suspended. Please contact your administrator.",
        account_status: user.status
      })
    }

    // Check admin's license
    if (user.admin_id) {
      const { verifyAdminLicense } = await import('../../utils/licenseUtils.js')
      const licenseCheck = await verifyAdminLicense(user.admin_id)
      
      if (!licenseCheck.valid) {
        const [adminInfo] = await connection.query(
          "SELECT username, email FROM admin WHERE id = ?",
          [user.admin_id]
        )
        
        return res.status(403).json({
          success: false,
          message: licenseCheck.message || "Admin license has expired or is invalid",
          license_expired: true,
          license_info: licenseCheck.license,
          admin_info: adminInfo[0]
        })
      }

      const canCreate = await import('../../utils/licenseUtils.js').then(m => m.canCreateUser(user.admin_id))
      if (!canCreate.allowed) {
        return res.status(403).json({
          success: false,
          message: `User limit reached for this admin account.\n\n${canCreate.message}`,
          limit_reached: true
        })
      }
    }

    // Check if user already logged in with ACTIVE session
    const [sessions] = await connection.query(
      "SELECT * FROM user_sessions WHERE user_id = ? AND active = 1 AND expires_at > NOW()",
      [user.id]
    )

    if (sessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You are already logged in on another device. Please log out first.`,
        already_logged_in: true,
      })
    }

    // Create session for ticket_info user
    const deviceInfo = req.headers['user-agent'] || 'Unknown'
    const ipAddress = req.ip || req.connection.remoteAddress
    const sessionResult = await createUserSession(
      user.id,
      user.username,
      user.email,
      user.counter_no,
      user.admin_id,
      deviceInfo,
      ipAddress,
      'ticket_info' // Pass correct role
    )

    if (!sessionResult.success) {
      return res.status(500).json({ success: false, message: "Failed to create session" })
    }

    res.json({
      success: true,
      token: sessionResult.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: 'ticket_info',
        admin_id: user.admin_id,
      },
    })
  } finally {
    connection.release()
  }
}
