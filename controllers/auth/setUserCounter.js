import pool from "../../config/database.js"
import { createUserSession } from "./sessionManager.js"

export const setUserCounter = async (req, res) => {
  const { counter_no } = req.body
  const userId = req.user.id // From authenticateToken middleware

  if (!counter_no) {
    return res.status(400).json({ success: false, message: "Counter number is required" })
  }

  const connection = await pool.getConnection()
  try {
    // Get user details including admin_id
    const [users] = await connection.query(
      "SELECT admin_id, username, email FROM users WHERE id = ?",
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const user = users[0]

    if (!user.admin_id) {
      return res.status(400).json({ 
        success: false, 
        message: "User is not assigned to any admin" 
      })
    }

    // Check if counter is already occupied by ACTIVE session
    const [existingSessions] = await connection.query(
      "SELECT username, email FROM user_sessions WHERE counter_no = ? AND admin_id = ? AND active = 1 AND expires_at > NOW()",
      [counter_no, user.admin_id]
    )

    if (existingSessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Counter ${counter_no} is already occupied by ${existingSessions[0].username}`,
        occupied: true,
        occupiedBy: existingSessions[0]
      })
    }

    // 🎯 NOW CREATE SESSION WITH COUNTER - This is the main fix!
    const deviceInfo = req.headers['user-agent'] || 'Unknown'
    const ipAddress = req.ip || req.connection.remoteAddress
    
    const sessionResult = await createUserSession(
      userId,
      user.username,
      user.email,
      counter_no,  // NOW we have the counter number
      user.admin_id,
      deviceInfo,
      ipAddress
    )

    if (!sessionResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create session with counter" 
      })
    }

    console.log(`✅ Session created for user ${userId} with counter ${counter_no}`)

    res.json({
      success: true,
      message: "Counter assigned and session created successfully",
      counter_no,
      token: sessionResult.token,  // Return new token with session
    })
  } catch (error) {
    console.error("Error setting counter:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to assign counter",
      error: error.message 
    })
  } finally {
    connection.release()
  }
}
