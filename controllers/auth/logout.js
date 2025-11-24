import pool from "../../config/database.js"

export const logout = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    if (req.user.role === "user") {
      await connection.query("DELETE FROM user_sessions WHERE user_id = ?", [req.user.id])
    }

    res.json({ success: true, message: "Logged out successfully" })
  } finally {
    connection.release()
  }
}
