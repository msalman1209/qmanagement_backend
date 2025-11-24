import pool from "../../config/database.js"

export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params
  const { status, reason, caller } = req.body

  if (!status) {
    return res.status(400).json({ success: false, message: "Status required" })
  }

  const connection = await pool.getConnection()
  try {
    let updateQuery = "UPDATE tickets SET status = ?, status_time = NOW()"
    const params = [status]

    if (reason) {
      updateQuery += ", reason = ?"
      params.push(reason)
    }

    if (caller) {
      updateQuery += ", caller = ?, calling_user_time = NOW()"
      params.push(caller)
    }

    updateQuery += " WHERE ticket_id = ?"
    params.push(ticketId)

    await connection.query(updateQuery, params)

    res.json({ success: true, message: "Ticket updated" })
  } finally {
    connection.release()
  }
}
