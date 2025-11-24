import pool from "../../config/database.js"

export const transferTicket = async (req, res) => {
  const { ticketId } = req.params
  const { transferred_to, reason, transfer_by } = req.body

  if (!transferred_to) {
    return res.status(400).json({ success: false, message: "Transfer recipient required" })
  }

  const connection = await pool.getConnection()
  try {
    await connection.query(
      `UPDATE tickets 
       SET transfered = ?, transfered_time = NOW(), reason = ?, transfer_by = ?
       WHERE ticket_id = ?`,
      [transferred_to, reason || null, transfer_by || null, ticketId]
    )

    res.json({ success: true, message: "Ticket transferred" })
  } finally {
    connection.release()
  }
}
