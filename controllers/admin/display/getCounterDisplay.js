import pool from "../../../config/database.js"

export const getCounterDisplay = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const [display] = await connection.query("SELECT * FROM counter_display LIMIT 1")

    res.json({ success: true, display: display[0] || {} })
  } finally {
    connection.release()
  }
}
