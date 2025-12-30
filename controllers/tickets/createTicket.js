import pool from "../../config/database.js"
import { logActivity } from "../../routes/activityLogs.js"
import { getAdminTimezone, convertUTCToTimezone } from "../../utils/timezoneHelper.js"

export const createTicket = async (req, res) => {
  const { service_id, name, email, number, counter_no, user_id, admin_id } = req.body

  console.log('📝 [createTicket] Request body:', req.body);

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

    // Get admin's timezone for this ticket
    const adminTimezone = finalAdminId ? await getAdminTimezone(finalAdminId) : '+05:00'
    
    // Get current time in admin's timezone
    const now = new Date();
    const adminLocalTimeStr = convertUTCToTimezone(now, adminTimezone); // Returns YYYY-MM-DD HH:MM:SS
    const [ticketDate, ticketTimeStr] = adminLocalTimeStr.split(' ');
    const ticketTime = ticketTimeStr; // HH:MM:SS
    const createdAtTimestamp = adminLocalTimeStr; // YYYY-MM-DD HH:MM:SS
    
    console.log('🕐 [createTicket] Admin timezone:', adminTimezone, 'Date:', ticketDate, 'Time:', ticketTime, 'Timestamp:', createdAtTimestamp);

    // Get or create ticket counter for this prefix (using admin's local date)
    const [counters] = await connection.query(
      "SELECT * FROM ticket_counters WHERE prefix = ? AND last_reset_date = ?",
      [prefix, ticketDate]
    )

    let ticketNumber = 1
    if (counters.length > 0) {
      ticketNumber = counters[0].last_ticket_number + 1
      await connection.query("UPDATE ticket_counters SET last_ticket_number = ? WHERE prefix = ?", [
        ticketNumber,
        prefix,
      ])
    } else {
      // Reset counter for new day or create new prefix (starts from 1 at midnight in admin's timezone)
      await connection.query(
        "INSERT INTO ticket_counters (prefix, last_ticket_number, last_reset_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE last_ticket_number = ?, last_reset_date = ?",
        [prefix, ticketNumber, ticketDate, ticketNumber, ticketDate]
      )
    }

    const ticketId = `${prefix}-${ticketNumber}`

    const [result] = await connection.query(
      `INSERT INTO tickets 
       (ticket_id, service_name, counter_no, name, email, number, status, time, date, user_id, admin_id, created_at, last_updated, reason)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)`,
      [ticketId, service.service_name, counter_no || prefix, name || "", email || "", number || "", ticketTime, ticketDate, user_id || null, finalAdminId || null, createdAtTimestamp, createdAtTimestamp, ""]
    )

    // Log activity
    // Determine who created the ticket (receptionist, user, or admin)
    let creatorRole = 'user';
    let creatorName = 'Customer';
    
    if (user_id) {
      const [userInfo] = await connection.query("SELECT username, role FROM users WHERE id = ?", [user_id]);
      if (userInfo.length > 0) {
        creatorRole = userInfo[0].role;
        creatorName = userInfo[0].username;
      }
    }
    
    const actorInfo = creatorRole === 'receptionist' 
      ? `Receptionist (${creatorName})` 
      : creatorRole === 'user' 
        ? `User (${creatorName})`
        : creatorName;
    
    await logActivity(
      finalAdminId,
      user_id,
      creatorRole,
      'TICKET_CREATED',
      `${actorInfo} created ticket ${ticketId} for service: ${service.service_name}`,
      {
        ticket_id: ticketId,
        service_name: service.service_name,
        counter_no: counter_no || prefix,
        customer_name: name || "",
        created_by: creatorName,
        creator_role: creatorRole
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    console.log('✅ [createTicket] Ticket created successfully:', ticketId);
    
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
  } catch (error) {
    console.error('❌ [createTicket] Error:', error);
    console.error('❌ [createTicket] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create ticket", 
      error: error.message 
    });
  } finally {
    connection.release()
  }
}
