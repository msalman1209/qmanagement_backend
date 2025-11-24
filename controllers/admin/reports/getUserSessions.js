import pool from "../../../config/database.js"

export const getUserSessions = async (req, res) => {
  const { from_date, to_date } = req.query

  const connection = await pool.getConnection()
  try {
    let query = `
      SELECT ac.*, u.username, u.email 
      FROM all_counters ac 
      LEFT JOIN users u ON ac.username = u.username 
      WHERE 1=1
    `
    const params = []

    if (from_date && to_date) {
      query += " AND DATE(ac.date) BETWEEN ? AND ?"
      params.push(from_date, to_date)
    } else {
      query += " AND DATE(ac.date) = CURDATE()"
    }

    query += " ORDER BY ac.date DESC, ac.time DESC"

    const [sessions] = await connection.query(query, params)

    res.json({ success: true, sessions })
  } finally {
    connection.release()
  }
}
