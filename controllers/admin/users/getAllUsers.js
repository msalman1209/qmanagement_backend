import pool from "../../../config/database.js"

export const getAllUsers = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { adminId } = req.query

    let query = "SELECT id, username, email, status, admin_id FROM users"
    const params = []

    if (adminId) {
      query += " WHERE admin_id = ?"
      params.push(adminId)
    } else if (req.user?.role === "admin") {
      query += " WHERE admin_id = ?"
      params.push(req.user.id)
    }

    const [users] = await connection.query(query, params)

    res.json({ success: true, users })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ success: false, message: "Failed to retrieve users" })
  } finally {
    connection.release()
  }
}
