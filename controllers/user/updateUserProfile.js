import pool from "../../config/database.js"

export const updateUserProfile = async (req, res) => {
  const userId = req.user.id
  const { username, email } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.query("UPDATE users SET username = ?, email = ? WHERE id = ?", [username, email, userId])

    res.json({ success: true, message: "Profile updated successfully" })
  } finally {
    connection.release()
  }
}
