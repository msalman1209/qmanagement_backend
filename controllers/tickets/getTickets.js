import pool from "../../config/database.js"

export const getTickets = async (req, res) => {
  try {
    const { userId, today } = req.query
    const userRole = req.user.role

    let query = `
      SELECT 
        t.*,
        s.service_name,
        u.username as user_name
      FROM tickets t
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `
    const params = []

    // Filter by admin if user is receptionist
    if (userRole === 'user' && userId) {
      const [users] = await pool.query("SELECT admin_id FROM users WHERE id = ?", [userId])
      if (users.length > 0 && users[0].admin_id) {
        query += ` AND u.admin_id = ?`
        params.push(users[0].admin_id)
      }
    }

    // Filter by admin if user is admin
    if (userRole === 'admin') {
      query += ` AND u.admin_id = ?`
      params.push(req.user.id)
    }

    // Filter by today's date if requested
    if (today === 'true') {
      query += ` AND DATE(t.created_at) = CURDATE()`
    }

    query += ` ORDER BY t.created_at DESC LIMIT 100`

    const [tickets] = await pool.query(query, params)

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    })
  } catch (error) {
    console.error("Get tickets error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message
    })
  }
}
