import { verifyToken } from "../config/auth.js"
import { validateAdminSession, validateUserSession } from "../controllers/auth/sessionManager.js"
import { verifyAdminLicense } from "../utils/licenseUtils.js"

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  console.log('🔐 Auth middleware - Path:', req.path, 'Has token:', !!token)

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" })
  }

  try {
    // First verify JWT
    const decoded = verifyToken(token)
    
    console.log('✅ Token verified - User:', { id: decoded.id, role: decoded.role, username: decoded.username })
    
    // ✅ Check if this is a TEMPORARY token (for counter selection)
    if (decoded.temporary === true) {
      // Allow temporary token for counter selection only
      // No session validation needed
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        temporary: true
      }
      console.log('⏰ Temporary token used')
      return next()
    }
    
    // For regular tokens, validate session in database
    let sessionValidation
    if (decoded.role === 'user' || decoded.role === 'ticket_info' || decoded.role === 'receptionist') {
      console.log('👤 Validating user/receptionist session...')
      sessionValidation = await validateUserSession(token)
    } else if (decoded.role === 'admin' || decoded.role === 'super_admin') {
      console.log('🔑 Validating admin session...')
      sessionValidation = await validateAdminSession(token)
    }

    if (!sessionValidation || !sessionValidation.valid) {
      console.log('❌ Session validation failed:', sessionValidation?.message)
      return res.status(403).json({ 
        success: false, 
        message: sessionValidation?.message || "Session expired or invalid",
        session_expired: true
      })
    }

    req.user = sessionValidation.user
    console.log('✅ Session validated - User assigned to req.user:', req.user)
    next()
  } catch (error) {
    console.error('❌ Auth error:', error.message)
    res.status(403).json({ success: false, message: "Invalid token" })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔑 [authorize] Checking authorization - User role:', req.user?.role, 'Allowed roles:', roles)
    if (!roles.includes(req.user?.role)) {
      console.log('❌ [authorize] User role not authorized. User:', req.user?.role, 'Allowed:', roles)
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }
    console.log('✅ [authorize] User authorized')
    next()
  }
}

/**
 * Check if admin's license is valid and not expired
 * Super admins bypass this check
 */
export const checkLicenseExpiry = async (req, res, next) => {
  try {
    // Super admin bypass license check
    if (req.user.role === "super_admin") {
      return next()
    }

    // Check if user is admin
    if (req.user.role === "admin") {
      const adminId = req.user.id || req.user.admin_id

      if (!adminId) {
        return res.status(403).json({
          success: false,
          message: "Admin ID not found",
        })
      }

      // Verify admin license
      const verification = await verifyAdminLicense(adminId)

      if (!verification.valid) {
        return res.status(403).json({
          success: false,
          message: verification.message,
          license_expired: true,
          license_info: verification.license
        })
      }

      // Attach license info to request for later use
      req.license = verification.license
      req.daysRemaining = verification.daysRemaining

      // Warn if license is expiring soon (7 days or less)
      if (verification.daysRemaining <= 7) {
        res.setHeader('X-License-Warning', `License expiring in ${verification.daysRemaining} days`)
      }
    }

    next()
  } catch (error) {
    console.error("License check error:", error)
    return res.status(500).json({
      success: false,
      message: "Error checking license",
      error: error.message
    })
  }
}

/**
 * Check if admin can perform user-related operations
 */
export const checkUserLimits = async (req, res, next) => {
  try {
    // Super admin bypass
    if (req.user.role === "super_admin") {
      return next()
    }

    if (req.user.role === "admin" && req.method === "POST") {
      const adminId = req.user.id || req.user.admin_id
      const { canCreateUser } = await import("../utils/licenseUtils.js")
      
      const check = await canCreateUser(adminId)
      
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message,
          limit_reached: true,
          current: check.currentUsers,
          max: check.maxUsers
        })
      }

      // Attach limit info to request
      req.userLimits = check
    }

    next()
  } catch (error) {
    console.error("User limits check error:", error)
    return res.status(500).json({
      success: false,
      message: "Error checking user limits",
      error: error.message
    })
  }
}

/**
 * Check if admin can perform service-related operations
 */
export const checkServiceLimits = async (req, res, next) => {
  try {
    // Super admin bypass
    if (req.user.role === "super_admin") {
      return next()
    }

    if (req.user.role === "admin" && req.method === "POST") {
      const adminId = req.user.id || req.user.admin_id
      const { canCreateService } = await import("../utils/licenseUtils.js")
      
      const check = await canCreateService(adminId)
      
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.message,
          limit_reached: true,
          current: check.currentServices,
          max: check.maxServices
        })
      }

      // Attach limit info to request
      req.serviceLimits = check
    }

    next()
  } catch (error) {
    console.error("Service limits check error:", error)
    return res.status(500).json({
      success: false,
      message: "Error checking service limits",
      error: error.message
    })
  }
}

/**
 * Check if user has specific permission
 */
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Admin and super_admin have all permissions
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next()
      }

      // Get user permissions from database
      const pool = (await import('../config/database.js')).default
      const [users] = await pool.query(
        'SELECT permissions FROM users WHERE id = ?',
        [req.user.id]
      )

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      let permissions = users[0].permissions
      
      // Parse permissions if it's a string
      if (typeof permissions === 'string') {
        try {
          permissions = JSON.parse(permissions)
        } catch (e) {
          console.error('Failed to parse permissions:', e)
          permissions = null
        }
      }

      // Check if user has the required permission
      if (!permissions || !permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${permission.replace('can', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          missing_permission: permission
        })
      }

      // Attach permissions to request for later use
      req.permissions = permissions
      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      })
    }
  }
}
