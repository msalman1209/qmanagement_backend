import pool from "../../config/database.js"

export const getUserAssignedTickets = async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  const connection = await pool.getConnection()
  try {
    // Get user's assigned services
    const [assignedServices] = await connection.query(
      `SELECT service_id FROM user_services WHERE user_id = ?`,
      [userId]
    )

    if (assignedServices.length === 0) {
      return res.json({ 
        success: true, 
        tickets: [], 
        message: "No services assigned to this user" 
      })
    }

    const serviceIds = assignedServices.map(s => s.service_id)

    // Get service names for these IDs
    const [services] = await connection.query(
      `SELECT id, service_name as name FROM services WHERE id IN (${serviceIds.join(',')})`,
      []
    )

    const serviceMap = {}
    services.forEach(s => {
      serviceMap[s.id] = s.name
    })

    // Get tickets for these services with status filter
    const status = req.query.status || 'Pending' // Default to pending tickets
    const today = req.query.today === 'true'

    let ticketQuery = `
      SELECT 
        t.id,
        t.ticket_id as ticketNumber,
        t.service_name as service,
        t.time as submissionTime,
        t.date as submissionDate,
        t.status,
        t.name,
        t.email,
        t.number,
        t.representative,
        t.caller,
        t.calling_time,
        t.calling_user_time
      FROM tickets t
      WHERE t.service_name IN (${services.map(s => '?').join(',')})
      AND t.status = ?
    `

    const params = [...services.map(s => s.name), status]

    if (today) {
      ticketQuery += ` AND DATE(t.date) = CURDATE()`
    }

    ticketQuery += ` ORDER BY t.created_at ASC`

    const [tickets] = await connection.query(ticketQuery, params)

    res.json({ 
      success: true, 
      tickets,
      assignedServices: services,
      totalPending: tickets.length
    })
  } catch (error) {
    console.error("[getUserAssignedTickets] error", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  } finally {
    connection.release()
  }
}
