import pool from "../../config/database.js"

export const getTicketById = async (req, res) => {
  const { ticketId } = req.params

  const connection = await pool.getConnection()
  try {
    const [tickets] = await connection.query("SELECT * FROM tickets WHERE ticket_id = ?", [ticketId])

    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" })
    }

    res.json({ success: true, ticket: tickets[0] })
  } finally {
    connection.release()
  }
}
