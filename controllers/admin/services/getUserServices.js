import pool from "../../../config/database.js"

export const getUserServices = async (req, res) => {
  const { userId } = req.params

  const connection = await pool.getConnection()
  try {
    const [services] = await connection.query(
      `SELECT s.id, s.service_name, s.description, s.initial_ticket, s.color 
       FROM services s 
       INNER JOIN user_services us ON s.id = us.service_id 
       WHERE us.user_id = ?`,
      [userId]
    )

    res.json({ success: true, services })
  } finally {
    connection.release()
  }
}
