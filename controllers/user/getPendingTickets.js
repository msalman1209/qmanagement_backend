import pool from "../../config/database.js"

export const getPendingTickets = async (req, res) => {
  const userId = req.user.id
  const connection = await pool.getConnection()
  try {
    // Get user's assigned services
    const [userServices] = await connection.query(
      `SELECT s.service_name 
       FROM services s 
       INNER JOIN user_services us ON s.id = us.service_id 
       WHERE us.user_id = ?`,
      [userId]
    )

    if (userServices.length === 0) {
      return res.json({ success: true, tickets: [] })
    }

    const serviceNames = userServices.map(s => s.service_name)

    const [tickets] = await connection.query(
      `SELECT * FROM tickets 
       WHERE status = 'Pending' 
       AND service_name IN (?)
       ORDER BY created_at ASC LIMIT 20`,
      [serviceNames]
    )

    res.json({ success: true, tickets })
  } finally {
    connection.release()
  }
}
