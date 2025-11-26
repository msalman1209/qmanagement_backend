import pool from "../../config/database.js"
import { logoutAdmin, logoutUser } from "./sessionManager.js"

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" })
    }

    // Deactivate session based on role
    if (req.user.role === "user") {
      await logoutUser(token)
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      await logoutAdmin(token)
    }

    res.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, message: "Failed to logout" })
  }
}
