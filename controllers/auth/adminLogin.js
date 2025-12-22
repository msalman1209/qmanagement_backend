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
    // Check in admin table with role 'admin' (support both email and username)
    const [admins] = await connection.query(
      "SELECT * FROM admin WHERE (email = ? OR username = ?) AND role = 'admin'",
      [email, email]
    )

    let admin = null;
    let isUserWithAdminPermissions = false;

    if (admins.length === 0) {
      // 🔍 Admin not found in admin table, check users table with admin permissions (support both email and username)
      const [users] = await connection.query(
        "SELECT * FROM users WHERE email = ? OR username = ?",
        [email, email]
      )

      if (users.length === 0) {
        return res.status(401).json({ success: false, message: "Invalid credentials" })
      }

      const user = users[0];

      // Parse permissions if it's a string
      let userPermissions = user.permissions;
      if (typeof userPermissions === 'string') {
        try {
          userPermissions = JSON.parse(userPermissions);
        } catch (e) {
          userPermissions = null;
        }
      }

      // Check if user has admin access permission
      if (!userPermissions || !userPermissions.canAccessDashboard) {
        return res.status(401).json({ success: false, message: "Invalid credentials" })
      }

      // User has admin permissions, allow login as admin
      admin = user;
      isUserWithAdminPermissions = true;
    } else {
      admin = admins[0];
      
      // ✅ Strict role validation - only 'admin' role allowed for admin table users
      if (admin.role !== 'admin') {
        return res.status(401).json({ success: false, message: "Invalid credentials" })
      }
    }
    
    const passwordMatch = await bcryptjs.compare(password, admin.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Check license before allowing login (only for admins from admin table)
    if (!isUserWithAdminPermissions) {
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
    } else {
      // For users with admin permissions, use their admin_id for license check
      if (!admin.admin_id) {
        console.log(`⚠️ User ${admin.username} (ID: ${admin.id}) has admin permissions but no admin_id assigned. Skipping license check.`);
      } else {
        const { verifyAdminLicense } = await import('../../utils/licenseUtils.js')
        const licenseCheck = await verifyAdminLicense(admin.admin_id)
        
        if (!licenseCheck.valid) {
          console.log(`❌ License check failed for user ${admin.username} with admin_id ${admin.admin_id}`);
          return res.status(403).json({
            success: false,
            message: licenseCheck.message || "Your license has expired or is invalid",
            license_expired: true,
            license_info: licenseCheck.license
          })
        }
        console.log(`✅ License check passed for user ${admin.username} with admin_id ${admin.admin_id}`);
      }
    }

    // Create session in database
    const deviceInfo = req.headers['user-agent'] || 'Unknown'
    const ipAddress = req.ip || req.connection.remoteAddress
    
    // For users with admin permissions, use their admin_id as the effective admin ID
    // If admin_id is null, use their own id
    const effectiveAdminId = isUserWithAdminPermissions ? (admin.admin_id || admin.id) : admin.id;
    
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
      effectiveAdminId,
      'admin',
      `${isUserWithAdminPermissions ? 'User with admin permissions' : 'Admin'} ${admin.username} logged in successfully`,
      `Admin ${admin.username} logged in successfully`,
      {
        email: admin.email,
        device_info: deviceInfo,
        ip_address: ipAddress,
        is_user_with_admin_permissions: isUserWithAdminPermissions
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
        admin_id: effectiveAdminId,
        is_user_with_admin_permissions: isUserWithAdminPermissions,
        permissions: admin.permissions  // ✅ Include permissions in response
      },
    })
  } finally {
    connection.release()
  }
}
