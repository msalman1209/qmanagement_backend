import pool from "../../config/database.js"

export const getCompletedTickets = async (req, res) => {
  const userId = req.user.userId || req.user.id
  const { start_date, end_date } = req.query

  try {
    console.log(`📋 Fetching completed tickets for user ID: ${userId}`)
    console.log(`📅 Date range: ${start_date || 'all'} to ${end_date || 'all'}`)

    let query = `
      SELECT 
        t.id,
        t.ticket_id as ticket_number,
        t.service_name,
        t.status,
        t.created_at as ticket_created_time,
        t.service_time,
        t.calling_time as call_count,
        t.calling_user_time as called_time,
        t.status_time as status_update_time,
        t.counter_no as solved_by_counter,
        t.caller,
        t.representative_id,
        t.transfered,
        t.transfer_by,
        t.transfered_time,
        t.reason
      FROM tickets t
      WHERE t.representative_id = ?
        AND t.calling_user_time IS NOT NULL
        AND t.status IN ('Solved', 'Unattended', 'Not Solved', 'Pending')
        AND COALESCE(t.transfered, '0') IN ('', '0', 0)
    `
    const params = [userId]

    // Add date filters if provided
    if (start_date && end_date) {
      query += ` AND DATE(t.created_at) BETWEEN ? AND ?`
      params.push(start_date, end_date)
    } else if (start_date) {
      query += ` AND DATE(t.created_at) >= ?`
      params.push(start_date)
    } else if (end_date) {
      query += ` AND DATE(t.created_at) <= ?`
      params.push(end_date)
    }

    query += ` ORDER BY t.calling_user_time DESC, t.created_at DESC`

    const [tickets] = await pool.query(query, params)

    // Format tickets for frontend
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      service: ticket.service_name,
      status: ticket.status,
      ticketCreatedTime: ticket.ticket_created_time,
      serviceTime: ticket.service_time,
      calledTime: ticket.called_time,
      statusUpdateTime: ticket.status_update_time || ticket.called_time || ticket.ticket_created_time,
      calledCount: ticket.call_count || 0,
      transferInfo: ticket.transfer_by ? `Transferred by ${ticket.transfer_by}` : 'Not Transferred',
      transferTime: ticket.transfered_time || '0000-00-00 00:00:00',
      solvedBy: ticket.solved_by_counter || 'N/A',
      reason: ticket.reason || '',
      representativeId: ticket.representative_id
    }))

    console.log(`✅ Found ${formattedTickets.serviceTime} completed tickets`)
    if (formattedTickets.length > 0) {
      console.log('📤 Sample response:', JSON.stringify(formattedTickets[0], null, 2))
    }

    res.json({ 
      success: true, 
      tickets: formattedTickets,
      count: formattedTickets.length,
      filters: {
        startDate: start_date || null,
        endDate: end_date || null
      }
    })
  } catch (error) {
    console.error('[getCompletedTickets] Error:', error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch completed tickets",
      error: error.message 
    })
  }
}
