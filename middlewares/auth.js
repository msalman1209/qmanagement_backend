import { verifyToken } from "../config/auth.js"

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
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
