import pool from "../../../config/database.js"

export const getAllUsers = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const [users] = await connection.query("SELECT id, username, email FROM users")

    res.json({ success: true, users })
  } finally {
    connection.release()
  }
}
