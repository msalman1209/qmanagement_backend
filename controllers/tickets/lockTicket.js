import pool from "../../config/database.js"

export const lockTicket = async (req, res) => {
  const { ticketId } = req.params
  const { user_id, lock } = req.body

  const connection = await pool.getConnection()
  try {
    await connection.query("UPDATE tickets SET locked_by = ? WHERE ticket_id = ?", [lock ? user_id : null, ticketId])

    res.json({ success: true, message: lock ? "Ticket locked" : "Ticket unlocked" })
  } finally {
    connection.release()
  }
}
