import pool from "../../config/database.js"

export const callNextTicket = async (req, res) => {
  const { counter_no, user_id } = req.body

  if (!counter_no || !user_id) {
    return res.status(400).json({ success: false, message: "Counter number and user ID required" })
  }

  const connection = await pool.getConnection()
  try {
    // Get user's assigned services
    const [userServices] = await connection.query(
      `SELECT s.service_name 
       FROM services s 
       INNER JOIN user_services us ON s.id = us.service_id 
       WHERE us.user_id = ?`,
      [user_id]
    )

    if (userServices.length === 0) {
      return res.status(400).json({ success: false, message: "No services assigned to this user" })
    }

    const serviceNames = userServices.map(s => s.service_name)

    // Get next pending ticket for user's services
    const [tickets] = await connection.query(
      `SELECT * FROM tickets 
       WHERE status = 'Pending' 
       AND service_name IN (?)
       ORDER BY created_at ASC LIMIT 1`,
      [serviceNames]
    )

    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: "No pending tickets" })
    }

    const ticket = tickets[0]

    // Get user details
    const [users] = await connection.query("SELECT username FROM users WHERE id = ?", [user_id])
    const username = users[0]?.username || "Unknown"

    await connection.query(
      "UPDATE tickets SET status = ?, caller = ?, calling_user_time = NOW(), counter_no = ? WHERE id = ?",
      ["called", username, counter_no, ticket.id]
    )

    res.json({ success: true, message: "Ticket called", ticket: { ...ticket, counter_no, caller: username } })
  } finally {
    connection.release()
  }
}
