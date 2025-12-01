import { verifyToken } from "../config/auth.js"
import { validateAdminSession, validateUserSession } from "../controllers/auth/sessionManager.js"
import { verifyAdminLicense } from "../utils/licenseUtils.js"

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" })
  }

  try {
    // First verify JWT
    const decoded = verifyToken(token)
    
    // Then validate session in database
    let sessionValidation
    if (decoded.role === 'user') {
      sessionValidation = await validateUserSession(token)
    } else if (decoded.role === 'admin' || decoded.role === 'super_admin') {
      sessionValidation = await validateAdminSession(token)
    }

    if (!sessionValidation || !sessionValidation.valid) {
      return res.status(403).json({ 
        success: false, 
        message: sessionValidation?.message || "Session expired or invalid",
        session_expired: true
      })
    }

    req.user = sessionValidation.user
    next()
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" })
    }
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
