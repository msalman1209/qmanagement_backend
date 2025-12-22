import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"
import { createUserSession } from "./sessionManager.js"

export const userLogin = async (req, res) => {
  const { email, username, password } = req.body

  // Accept either email or username
  const loginIdentifier = email || username;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: "Email/Username and password required" })
  }

  const connection = await pool.getConnection()
  try {
    // Check by email OR username
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ? OR username = ?", 
      [loginIdentifier, loginIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const user = users[0]
    
    // ✅ Allow any user role to login - no role restriction
    // Users can login from any endpoint based on their assigned role
    const userRole = user.role || 'user';
    
    console.log('🔍 [userLogin] User found:', {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions_type: typeof user.permissions,
      permissions_raw: user.permissions
    });
    
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

      // Check admin license if user is assigned to an admin
    if (user.admin_id) {
      const { verifyAdminLicense } = await import('../../utils/licenseUtils.js')
      const licenseCheck = await verifyAdminLicense(user.admin_id)
      
      if (!licenseCheck.valid) {
        // Get admin details for better error message
        const [admins] = await connection.query("SELECT username, email FROM admin WHERE id = ?", [user.admin_id])
        const adminInfo = admins.length > 0 ? admins[0] : null
        
        return res.status(403).json({
          success: false,
          message: adminInfo 
            ? `❌ Admin license has expired!\n\nAdmin: ${adminInfo.username}\nEmail: ${adminInfo.email}\n\n📞 Please contact your admin to renew the license.`
            : "Admin license has expired or is invalid. Please contact your admin.",
          license_expired: true,
          license_info: licenseCheck.license,
          admin_info: adminInfo
        })
      }

      // ✅ DO NOT CHECK USER LIMITS DURING LOGIN
      // User limit check should only happen during user CREATION
      // Existing users should be able to login even if limit is reached
    }    // Check if user already logged in with ACTIVE session
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

    // ⚠️ DON'T create session here for users with role='user'
    // Session will be created AFTER counter selection
    // Only create session for receptionist or other roles without counter requirement
    
    let sessionToken = null;
    
    // If user has role='user', they need to select counter first - NO SESSION YET
    if (user.role && user.role !== 'user') {
      // For receptionist and other roles, create session immediately
      const deviceInfo = req.headers['user-agent'] || 'Unknown'
      const ipAddress = req.ip || req.connection.remoteAddress
      const sessionResult = await createUserSession(
        user.id,
        user.username,
        user.email,
        user.counter_no,
        user.admin_id,
        deviceInfo,
        ipAddress
      )

      if (!sessionResult.success) {
        return res.status(500).json({ success: false, message: "Failed to create session" })
      }
      
      sessionToken = sessionResult.token;
    } else {
      // For role='user', generate temporary token (will create session after counter selection)
      const tempToken = generateToken({ 
        id: user.id, 
        username: user.username, 
        role: 'user',
        temporary: true  // Mark as temporary token
      });
      sessionToken = tempToken;
    }

    console.log('✅ [userLogin] Login successful, sending response:', {
      user_id: user.id,
      username: user.username,
      role: user.role,
      has_permissions: !!user.permissions,
      permissions_type: typeof user.permissions
    });

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role || "user",
        admin_id: user.admin_id,
        permissions: user.permissions,  // ✅ Include permissions in response
      },
      needs_counter_selection: user.role === 'user' || !user.role,  // Flag to show counter modal
    })
  } finally {
    connection.release()
  }
}
