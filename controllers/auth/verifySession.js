import { verifyToken } from "../../config/auth.js"
import { validateAdminSession, validateUserSession } from "./sessionManager.js"

export const verifyCurrentSession = async (req, res) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "No token provided",
      session_expired: true
    })
  }

  try {
    // Verify JWT
    const decoded = verifyToken(token)
    console.log('🔍 Verify session - decoded role:', decoded.role, 'user id:', decoded.id)
    
    // Validate session in database
    let sessionValidation
    if (decoded.role === 'user' || decoded.role === 'ticket_info' || decoded.role === 'receptionist') {
      console.log('  ✅ Validating user session for role:', decoded.role)
      sessionValidation = await validateUserSession(token)
    } else if (decoded.role === 'admin' || decoded.role === 'super_admin') {
      console.log('  ✅ Validating admin session')
      sessionValidation = await validateAdminSession(token)
    }

    if (!sessionValidation || !sessionValidation.valid) {
      console.log('  ❌ Session validation failed:', sessionValidation?.message)
      return res.status(403).json({ 
        success: false, 
        message: sessionValidation?.message || "Session expired or invalid",
        session_expired: true
      })
    }
    
    console.log('  ✅ Session validated successfully for user:', sessionValidation.user.username)

    // Check license for admins
    if (decoded.role === 'admin') {
      const { verifyAdminLicense } = await import('../../utils/licenseUtils.js')
      
      // If user has admin_id (user with admin permissions), skip license check
      // They are not actual admins, just users with admin-level permissions
      // Their access is controlled by their admin, not by a separate license
      if (sessionValidation.user.admin_id && sessionValidation.user.admin_id !== sessionValidation.user.id) {
        console.log('⚠️ [verifySession] User with admin permissions detected - skipping license check');
        console.log('🔍 [verifySession] User data:', { id: sessionValidation.user.id, admin_id: sessionValidation.user.admin_id });
        return res.status(200).json({
          success: true,
          user: sessionValidation.user,
          license_valid: true,
          message: "Session is valid"
        });
      }
      
      // For actual admins, check their license
      const adminIdToCheck = sessionValidation.user.id;
      
      console.log('🔍 [verifySession] Checking license for actual admin ID:', adminIdToCheck);
      
      const licenseCheck = await verifyAdminLicense(adminIdToCheck);
      
      console.log('🔍 [verifySession] License check result:', { valid: licenseCheck.valid, message: licenseCheck.message });
      
      if (!licenseCheck.valid) {
        console.log('❌ [verifySession] License check failed, returning 403');
        return res.status(403).json({
          success: false,
          message: licenseCheck.message,
          license_expired: true,
          license_info: licenseCheck.license
        })
      }

      console.log('✅ [verifySession] License check passed, returning 200');
      return res.status(200).json({
        success: true,
        user: sessionValidation.user,
        license_valid: true,
        days_remaining: licenseCheck.daysRemaining,
        message: "Session and license are valid"
      })
    }

    res.status(200).json({
      success: true,
      user: sessionValidation.user,
      message: "Session is valid"
    })
  } catch (error) {
    console.error("Verify session error:", error)
    res.status(403).json({ 
      success: false, 
      message: "Invalid token",
      session_expired: true
    })
  }
}
