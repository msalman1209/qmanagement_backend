import pool from "../../config/database.js"

export const createTicket = async (req, res) => {
  const { service_id, name, email, number, counter_no, user_id, admin_id } = req.body

  if (!service_id) {
    return res.status(400).json({ success: false, message: "Service ID required" })
  }

  const connection = await pool.getConnection()
  try {
    // Get service details
    const [services] = await connection.query("SELECT * FROM services WHERE id = ?", [service_id])

    if (services.length === 0) {
      return res.status(404).json({ success: false, message: "Service not found" })
    }

    const service = services[0]
    const prefix = service.initial_ticket

    // Get admin_id from user if not provided
    let finalAdminId = admin_id
    if (!finalAdminId && user_id) {
      const [users] = await connection.query("SELECT admin_id FROM users WHERE id = ?", [user_id])
      if (users.length > 0) {
        finalAdminId = users[0].admin_id
      }
    }

    // Get or create ticket counter for this prefix
    const today = new Date().toISOString().split("T")[0]
    const [counters] = await connection.query(
      "SELECT * FROM ticket_counters WHERE prefix = ? AND last_reset_date = ?",
      [prefix, today]
    )

    let ticketNumber = 101
    if (counters.length > 0) {
      ticketNumber = counters[0].last_ticket_number + 1
      await connection.query("UPDATE ticket_counters SET last_ticket_number = ? WHERE prefix = ?", [
        ticketNumber,
        prefix,
      ])
    } else {
      // Reset counter for new day or create new prefix
      await connection.query(
        "INSERT INTO ticket_counters (prefix, last_ticket_number, last_reset_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE last_ticket_number = ?, last_reset_date = ?",
        [prefix, ticketNumber, today, ticketNumber, today]
      )
    }

    const ticketId = `${prefix}-${ticketNumber}`
    const currentTime = new Date().toTimeString().split(" ")[0]

    const [result] = await connection.query(
      `INSERT INTO tickets 
       (ticket_id, service_name, counter_no, name, email, number, status, time, date, user_id, admin_id)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)`,
      [ticketId, service.service_name, counter_no || prefix, name || "", email || "", number || "", currentTime, today, user_id || null, finalAdminId || null]
    )

    res.status(201).json({ 
      success: true, 
      message: "Ticket created", 
      ticket_id: ticketId,
      ticket: {
        id: result.insertId,
        ticket_id: ticketId,
        service_name: service.service_name,
        name: name || "",
        email: email || "",
        number: number || ""
      }
    })
  } finally {
    connection.release()
  }
}
