import pool from "../../config/database.js"

export const getUserSessions = async (req, res) => {
  const userId = req.user.id

  const connection = await pool.getConnection()
  try {
    const [sessions] = await connection.query(
      "SELECT * FROM user_sessions WHERE user_id = ? ORDER BY last_activity DESC",
      [userId]
    )

    res.json({ success: true, sessions })
  } finally {
    connection.release()
  }
}
