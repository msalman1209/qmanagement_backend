import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

// Allows partial updates. Only provided fields are updated.
// Accepts: username, email, password (hashed), status, admin_id (super_admin only)
export const updateUser = async (req, res) => {
  const { userId } = req.params
  const { username, email, password, status, admin_id } = req.body || {}

  const connection = await pool.getConnection()
  try {
    const [users] = await connection.query("SELECT id FROM users WHERE id = ?", [userId])
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const sets = []
    const params = []

    if (typeof username !== 'undefined') {
      sets.push("username = ?")
      params.push(username)
    }
    if (typeof email !== 'undefined') {
      sets.push("email = ?")
      params.push(email)
    }
    if (typeof password !== 'undefined' && password !== '') {
      const hashedPassword = await bcryptjs.hash(password, 10)
      sets.push("password = ?")
      params.push(hashedPassword)
    }
    if (typeof status !== 'undefined') {
      sets.push("status = ?")
      params.push(status)
    }
    if (typeof admin_id !== 'undefined' && req.user?.role === 'super_admin') {
      sets.push("admin_id = ?")
      params.push(admin_id)
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update" })
    }

    const updateQuery = `UPDATE users SET ${sets.join(", ")} WHERE id = ?`
    params.push(userId)
    await connection.query(updateQuery, params)

    res.json({ success: true, message: "User updated successfully" })
  } catch (err) {
    console.error("[updateUser] error", err)
    res.status(500).json({ success: false, message: "Internal server error" })
  } finally {
    connection.release()
  }
}
