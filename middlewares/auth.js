import { verifyToken } from "../config/auth.js"
import { validateAdminSession, validateUserSession } from "../controllers/auth/sessionManager.js"

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

export const checkLicenseExpiry = async (req, res, next) => {
  if (req.user.role === "admin") {
    const today = new Date().toISOString().split("T")[0]
    if (req.user.license_expiry_date < today) {
      return res.status(403).json({
        success: false,
        message: "Please update your license.",
        license_expired: true,
      })
    }
  }
  next()
}
