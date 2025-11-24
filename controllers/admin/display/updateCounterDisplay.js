import pool from "../../../config/database.js"

export const updateCounterDisplay = async (req, res) => {
  const { ad_video, ticker } = req.body

  const connection = await pool.getConnection()
  try {
    const [existing] = await connection.query("SELECT id FROM counter_display LIMIT 1")

    if (existing.length > 0) {
      await connection.query("UPDATE counter_display SET ad_video = ?, ticker = ? WHERE id = ?", [
        ad_video,
        ticker,
        existing[0].id,
      ])
    } else {
      await connection.query("INSERT INTO counter_display (ad_video, ticker) VALUES (?, ?)", [ad_video, ticker])
    }

    res.json({ success: true, message: "Counter display updated successfully" })
  } finally {
    connection.release()
  }
}
