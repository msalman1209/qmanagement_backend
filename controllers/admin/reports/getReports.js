import pool from "../../../config/database.js"

export const getReports = async (req, res) => {
  const { from_date, to_date, counter_no, service_id } = req.query

  const connection = await pool.getConnection()
  try {
    // Get admin_id: use admin_id for users with admin permissions, otherwise use user's own id
    const admin_id = req.user.admin_id || req.user.id;
    
    let query = "SELECT * FROM tickets WHERE admin_id = ?"
    const params = [admin_id]

    if (from_date && to_date) {
      query += " AND DATE(date) BETWEEN ? AND ?"
      params.push(from_date, to_date)
    }

    if (counter_no) {
      query += " AND counter_no = ?"
      params.push(counter_no)
    }

    if (service_id) {
      query += " AND service_name = (SELECT service_name FROM services WHERE id = ?)"
      params.push(service_id)
    }

    query += " ORDER BY created_at DESC"

    const [tickets] = await connection.query(query, params)

    // Get statistics
    const stats = {
      total: tickets.length,
      solved: tickets.filter(t => t.status === "Solved").length,
      pending: tickets.filter(t => t.status === "Pending").length,
      unattendant: tickets.filter(t => t.status === "Unattendant").length,
      not_solved: tickets.filter(t => t.status === "Not Solved").length,
      transferred: tickets.filter(t => t.transfered).length,
    }

    res.json({ success: true, tickets, statistics: stats })
  } finally {
    connection.release()
  }
}
