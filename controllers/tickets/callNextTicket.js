import pool from "../../config/database.js"
import { logActivity } from "../../routes/activityLogs.js"
import { getAdminTimezone, convertUTCToTimezone } from "../../utils/timezoneHelper.js"

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

    // Get admin timezone for this ticket
    const adminId = ticket.admin_id;
    const adminTimezone = adminId ? await getAdminTimezone(adminId) : '+05:00';
    const now = new Date();
    const currentTimeInTimezone = convertUTCToTimezone(now, adminTimezone); // Returns YYYY-MM-DD HH:MM:SS
    
    console.log('🕐 [callNextTicket] Admin ID:', adminId);
    console.log('🕐 [callNextTicket] Admin timezone:', adminTimezone);
    console.log('🕐 [callNextTicket] Current UTC time:', now.toISOString());
    console.log('🕐 [callNextTicket] Converted time:', currentTimeInTimezone);
    console.log('Updating ticket with:', {
      status: 'called',
      caller: username,
      representative: username,
      representative_id: user_id,
      counter_no,
      calling_user_time: currentTimeInTimezone,
      last_updated: currentTimeInTimezone,
      ticket_id: ticket.id
    });

    const [updateResult] = await connection.query(
      "UPDATE tickets SET status = ?, status_time = ?, caller = ?, representative = ?, representative_id = ?, calling_user_time = ?, counter_no = ?, last_updated = ? WHERE id = ?",
      ["called", currentTimeInTimezone, username, username, user_id, currentTimeInTimezone, counter_no, currentTimeInTimezone, ticket.id]
    )

    console.log('Update result:', updateResult.affectedRows, 'rows affected');
    
    // Verify what was actually saved
    const [verifyTicket] = await connection.query(
      "SELECT calling_user_time, last_updated, status FROM tickets WHERE id = ?",
      [ticket.id]
    );
    if (verifyTicket.length > 0) {
      console.log('✓ Saved values in database:');
      console.log('  calling_user_time:', verifyTicket[0].calling_user_time);
      console.log('  last_updated:', verifyTicket[0].last_updated);
      console.log('  status:', verifyTicket[0].status);
    }

    // Log activity
    const [userDetails] = await connection.query("SELECT admin_id, role, username FROM users WHERE id = ?", [user_id]);
    console.log('🔍 [callNextTicket] User details for logging:', userDetails[0]);
    if (userDetails.length > 0) {
      console.log('🎯 [callNextTicket] Calling logActivity...');
      
      const actorInfo = userDetails[0].role === 'receptionist' 
        ? `Receptionist (${username})` 
        : userDetails[0].role === 'user' 
          ? `User (${username})`
          : username;
      
      await logActivity(
        userDetails[0].admin_id,
        user_id,
        userDetails[0].role,
        'TICKET_CALLED',
        `${actorInfo} called ticket ${ticket.ticket_id} to counter ${counter_no}`,
        {
          ticket_id: ticket.ticket_id,
          ticket_number: ticket.ticket_id,
          counter: counter_no,
          service_name: ticket.service_name,
          called_by: username,
          caller_role: userDetails[0].role
        },
        req
      ).catch(err => console.error('❌ [callNextTicket] Failed to log activity:', err));
      console.log('✅ [callNextTicket] logActivity call completed');
    } else {
      console.warn('⚠️ [callNextTicket] No user details found, cannot log activity');
    }

    res.json({ success: true, message: "Ticket called", ticket: { ...ticket, counter_no, caller: username, representative: username } })
  } finally {
    connection.release()
  }
}
