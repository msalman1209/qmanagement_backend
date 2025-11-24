import pool from "../../../config/database.js"

export const removeServiceFromUser = async (req, res) => {
  const { user_id, service_id } = req.body

  if (!user_id || !service_id) {
    return res.status(400).json({ success: false, message: "User ID and Service ID required" })
  }

  const connection = await pool.getConnection()
  try {
    await connection.query("DELETE FROM user_services WHERE user_id = ? AND service_id = ?", [user_id, service_id])

    res.json({ success: true, message: "Service removed from user successfully" })
  } finally {
    connection.release()
  }
}
