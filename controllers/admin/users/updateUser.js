import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const updateUser = async (req, res) => {
  const { userId } = req.params
  const { username, email, password } = req.body

  const connection = await pool.getConnection()
  try {
    // Check if user exists
    const [users] = await connection.query("SELECT id FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    let updateQuery = "UPDATE users SET username = ?, email = ?"
    const params = [username, email]

    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10)
      updateQuery += ", password = ?"
      params.push(hashedPassword)
    }

    updateQuery += " WHERE id = ?"
    params.push(userId)

    await connection.query(updateQuery, params)

    res.json({ success: true, message: "User updated successfully" })
  } finally {
    connection.release()
  }
}
