import pool from "../../config/database.js"

export const getUserDashboard = async (req, res) => {
  const userId = req.user.id
  const connection = await pool.getConnection()
  try {
    const today = new Date().toISOString().split("T")[0]

    // Get user's assigned services
    const [userServices] = await connection.query(
      `SELECT s.service_name 
       FROM services s 
       INNER JOIN user_services us ON s.id = us.service_id 
       WHERE us.user_id = ?`,
      [userId]
    )

    const serviceNames = userServices.map(s => s.service_name)

    // Get statistics for today
    let stats = { total_tickets: 0, solved: 0, pending: 0, transferred: 0 }

    if (serviceNames.length > 0) {
      const [results] = await connection.query(
        `SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'Solved' THEN 1 ELSE 0 END) as solved,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN transfered IS NOT NULL THEN 1 ELSE 0 END) as transferred
        FROM tickets 
        WHERE DATE(date) = ? AND service_name IN (?)`,
        [today, serviceNames]
      )
      stats = results[0]
    }

    res.json({
      success: true,
      statistics: stats,
    })
  } finally {
    connection.release()
  }
}
