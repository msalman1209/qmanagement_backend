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
    // ✅ Allow both ticket_info users AND both_user (receptionist,ticket_info)
    const [users] = await connection.query(
      `SELECT * FROM users 
       WHERE (email = ? OR username = ?) 
         AND (role = 'ticket_info' OR role LIKE '%ticket_info%')`, 
      [loginIdentifier, loginIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const user = users[0]
    
    console.log('✅ Ticket Info Login - User found:', { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    });
    
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

      // ✅ DO NOT CHECK USER LIMITS DURING LOGIN
      // User limit check should only happen during user CREATION
      // Existing users should be able to login even if limit is reached
    }

    // ✅ Check session limits from license
    let sessionLimit = 1; // Default limit
    
    if (user.admin_id) {
      const [licenseInfo] = await connection.query(
        `SELECT max_ticket_info_sessions, both_user_ticket_info_sessions 
         FROM licenses WHERE admin_id = ? AND status = 'active' LIMIT 1`,
        [user.admin_id]
      );
      
      if (licenseInfo.length > 0) {
        const license = licenseInfo[0];
        
        // Check if user is both_user (has both roles)
        const isBothUser = user.role && user.role.includes(',');
        
        if (isBothUser) {
          // Use both_user specific ticket info session limit
          sessionLimit = license.both_user_ticket_info_sessions || 1;
        } else {
          // Use regular ticket info session limit
          sessionLimit = license.max_ticket_info_sessions || 1;
        }
        
        console.log('📊 Session Limit Check:', { 
          userId: user.id, 
          username: user.username,
          role: user.role,
          isBothUser,
          sessionLimit 
        });
      }
    }
    
    // Count active ticket_info sessions for this user
    const [activeSessions] = await connection.query(
      "SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND role = 'ticket_info' AND active = 1 AND expires_at > NOW()",
      [user.id]
    );
    
    const activeSessionCount = activeSessions[0].count;
    
    console.log('🔢 Active Sessions:', activeSessionCount, '/ Limit:', sessionLimit);
    
    if (activeSessionCount >= sessionLimit) {
      return res.status(409).json({
        success: false,
        message: `Session limit reached! You have ${activeSessionCount} active ticket info session(s). Maximum allowed: ${sessionLimit}. Please close an existing session first.`,
        session_limit_reached: true,
        active_sessions: activeSessionCount,
        max_sessions: sessionLimit
      });
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
