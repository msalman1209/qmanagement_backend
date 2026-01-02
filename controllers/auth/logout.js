import pool from "../../config/database.js"
import { logoutAdmin, logoutUser } from "./sessionManager.js"
import { logActivity } from "../../routes/activityLogs.js"

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" })
    }

    console.log(`🔓 Logout request for role: ${req.user.role}, user: ${req.user.username || req.user.id}, user_id: ${req.user.id}`)

    // Delete ONLY current session (by token) - keeps other device sessions active
    let result
    
    // Handle both single roles and comma-separated roles (e.g., "receptionist,ticket_info")
    const userRole = req.user.role || '';
    const isUserRole = userRole === "user" || userRole.includes("receptionist") || userRole.includes("ticket_info");
    const isAdminRole = userRole === "admin" || userRole === "super_admin";
    
    if (isUserRole) {
      // Delete only THIS session (by token) from user_sessions
      const connection = await pool.getConnection()
      try {
        const [deleteResult] = await connection.query(
          "DELETE FROM user_sessions WHERE user_id = ? AND token = ?",
          [req.user.id, token]
        )
        console.log(`✅ Deleted current session for user ${req.user.id} (affected rows: ${deleteResult.affectedRows})`)
        result = { success: true, rowsAffected: deleteResult.affectedRows }
      } finally {
        connection.release()
      }
    } else if (isAdminRole) {
      // Delete only THIS session (by token) from admin_sessions
      const connection = await pool.getConnection()
      try {
        const [deleteResult] = await connection.query(
          "DELETE FROM admin_sessions WHERE admin_id = ? AND token = ?",
          [req.user.id, token]
        )
        console.log(`✅ Deleted current session for admin ${req.user.id} (affected rows: ${deleteResult.affectedRows})`)
        result = { success: true, rowsAffected: deleteResult.affectedRows }
      } finally {
        connection.release()
      }
    }

    if (result && result.success) {
      console.log(`✅ Logout successful - All sessions deleted from database`)
      
      // Log logout activity
      const connection = await pool.getConnection();
      try {
        let adminId = req.user.id;
        
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
          const [admins] = await connection.query(
            "SELECT admin_id FROM users WHERE id = ?",
            [req.user.id]
          );
          adminId = admins[0]?.admin_id || req.user.id;
        }
        
        await logActivity(
          adminId,
          req.user.id,
          req.user.role,
          'LOGOUT',
          `${req.user.role} ${req.user.username || req.user.id} logged out successfully`,
          {},
          req
        ).catch(err => console.error('Failed to log activity:', err));
      } finally {
        connection.release();
      }
      
      res.json({ 
        success: true, 
        message: "Logged out successfully",
        sessions_deleted: result.rowsAffected
      })
    } else {
      console.warn('⚠️ Logout completed but no sessions were found to delete')
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
