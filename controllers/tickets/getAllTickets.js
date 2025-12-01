import pool from "../../config/database.js"

export const getAllTickets = async (req, res) => {
  const { status, from_date, to_date, counter_no, search, today, userId } = req.query
  const userRole = req.user?.role

  const connection = await pool.getConnection()
  try {
    let query = "SELECT * FROM tickets WHERE 1=1"
    const params = []

    // Filter by today's date
    if (today === 'true') {
      query += " AND DATE(created_at) = CURDATE()"
    }

    if (status) {
      query += " AND status = ?"
      params.push(status)
    }

    if (counter_no) {
      query += " AND counter_no = ?"
      params.push(counter_no)
    }

    if (from_date && to_date) {
      query += " AND DATE(date) BETWEEN ? AND ?"
      params.push(from_date, to_date)
    } else if (from_date) {
      query += " AND DATE(date) >= ?"
      params.push(from_date)
    }

    if (search) {
      query += " AND (ticket_id LIKE ? OR name LIKE ? OR service_name LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += " ORDER BY created_at DESC LIMIT 100"

    const [tickets] = await connection.query(query, params)

    res.json({ success: true, tickets })
  } finally {
    connection.release()
  }
}
