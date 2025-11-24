import pool from "../../config/database.js"

export const getUserProfile = async (req, res) => {
  const userId = req.user.id
  const connection = await pool.getConnection()
  try {
    const [users] = await connection.query("SELECT id, username, email FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Get assigned services
    const [services] = await connection.query(
      `SELECT s.id, s.service_name, s.description 
       FROM services s 
       INNER JOIN user_services us ON s.id = us.service_id 
       WHERE us.user_id = ?`,
      [userId]
    )

    res.json({ success: true, user: users[0], services })
  } finally {
    connection.release()
  }
}
