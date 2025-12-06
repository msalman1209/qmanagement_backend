import pool from "../../config/database.js"
import { logoutAdmin, logoutUser } from "./sessionManager.js"

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" })
    }

    console.log(`🔓 Logout request for role: ${req.user.role}, user: ${req.user.username || req.user.id}`)

    // Deactivate session based on role
    let result
    if (req.user.role === "user") {
      result = await logoutUser(token)
    } else if (req.user.role === "admin" || req.user.role === "super_admin") {
      result = await logoutAdmin(token)
    }

    if (result && result.success) {
      console.log(`✅ Logout successful - Session deactivated in database`)
      res.json({ 
        success: true, 
        message: "Logged out successfully",
        session_deactivated: true
      })
    } else {
      console.warn('⚠️ Logout completed but session may not have been found')
      res.json({ 
        success: true, 
        message: "Logged out (no active session found)" 
      })
    }
  } catch (error) {
    console.error('❌ Logout error:', error)
    res.status(500).json({ success: false, message: "Failed to logout" })
  }
}
