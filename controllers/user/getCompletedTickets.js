import pool from "../../config/database.js"

export const getCompletedTickets = async (req, res) => {
  const userId = req.user.id
  const { from_date, to_date } = req.query

  const connection = await pool.getConnection()
  try {
    // Get user details
    const [users] = await connection.query("SELECT username FROM users WHERE id = ?", [userId])
    const username = users[0]?.username

    if (!username) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    let query = "SELECT * FROM tickets WHERE caller = ?"
    const params = [username]

    if (from_date && to_date) {
      query += " AND DATE(date) BETWEEN ? AND ?"
      params.push(from_date, to_date)
    } else {
      query += " AND DATE(date) = CURDATE()"
    }

    query += " ORDER BY created_at DESC"

    const [tickets] = await connection.query(query, params)

    res.json({ success: true, tickets })
  } finally {
    connection.release()
  }
}
