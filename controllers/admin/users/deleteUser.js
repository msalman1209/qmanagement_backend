import pool from "../../../config/database.js"

export const deleteUser = async (req, res) => {
  const { userId } = req.params

  const connection = await pool.getConnection()
  try {
    const [users] = await connection.query("SELECT id FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    await connection.query("DELETE FROM users WHERE id = ?", [userId])

    res.json({ success: true, message: "User deleted successfully" })
  } finally {
    connection.release()
  }
}
