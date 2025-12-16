import pool from "../../config/database.js"
import { getAdminTimezone, convertUTCToTimezone } from "../../utils/timezoneHelper.js"

export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params
  const { status, reason, caller, name, email, number, serviceTimeSeconds } = req.body
  const userId = req.user?.id;

  const connection = await pool.getConnection()
  try {
    // Get ticket to find admin_id and determine timezone
    const [tickets] = await connection.query(
      "SELECT admin_id FROM tickets WHERE ticket_id = ?",
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" })
    }

    const adminId = tickets[0].admin_id;
    const adminTimezone = adminId ? await getAdminTimezone(adminId) : '+05:00';
    const now = new Date();
    const currentTimeInTimezone = convertUTCToTimezone(now, adminTimezone); // Returns YYYY-MM-DD HH:MM:SS
    
    console.log('🕐 [updateTicketStatus] Admin timezone:', adminTimezone, 'Current time:', currentTimeInTimezone);

    // Get username and check if representative needs to be set
    let username = null;
    let needsRepresentative = false;
    let serviceTime = null;
    
    // Set representative for status changes (Unattended, Solved, Not Solved)
    if (status && userId && ['Unattended', 'Solved', 'Not Solved'].includes(status)) {
      const [users] = await connection.query(
        "SELECT username FROM users WHERE id = ?",
        [userId]
      );
      username = users.length > 0 ? users[0].username : null;
      needsRepresentative = true;
      
      // Calculate service time if provided (in seconds)
      if (serviceTimeSeconds && (status === 'Solved' || status === 'Not Solved')) {
        const hours = Math.floor(serviceTimeSeconds / 3600);
        const minutes = Math.floor((serviceTimeSeconds % 3600) / 60);
        const seconds = serviceTimeSeconds % 60;
        serviceTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      
      console.log('🎯 [updateTicketStatus] Updating ticket with:', {
        status,
        representative: username,
        representative_id: userId,
        service_time: serviceTime,
        ticket_id: ticketId
      });
    }

    // Build dynamic update query
    let updateFields = []
    const params = []

    if (status) {
      updateFields.push("status = ?")
      params.push(status)
      updateFields.push("status_time = ?")
      params.push(currentTimeInTimezone)
      console.log('🕐 [updateTicketStatus] Setting status_time with timezone:', currentTimeInTimezone);
      
      // Add representative info for status changes
      if (needsRepresentative && username) {
        updateFields.push("representative = ?")
        params.push(username)
        updateFields.push("representative_id = ?")
        params.push(userId)
        
        // Add service time if calculated
        if (serviceTime) {
          updateFields.push("service_time = ?")
          params.push(serviceTime)
        }
      }
    }

    if (reason) {
      updateFields.push("reason = ?")
      params.push(reason)
    }

    if (caller) {
      updateFields.push("caller = ?")
      params.push(caller)
      updateFields.push("calling_user_time = ?")
      params.push(currentTimeInTimezone)
      console.log('🕐 [updateTicketStatus] Setting calling_user_time with timezone:', currentTimeInTimezone);
    }

    if (name !== undefined) {
      updateFields.push("name = ?")
      params.push(name)
    }

    if (email !== undefined) {
      updateFields.push("email = ?")
      params.push(email)
    }

    if (number !== undefined) {
      updateFields.push("number = ?")
      params.push(number)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" })
    }

    // Always update last_updated timestamp with admin's timezone
    updateFields.push("last_updated = ?")
    params.push(currentTimeInTimezone)
    console.log('🕐 [updateTicketStatus] Setting last_updated with timezone:', currentTimeInTimezone);
    
    // Also update status_time if it wasn't already set (for updates that don't change status)
    if (!updateFields.some(f => f.includes('status_time'))) {
      updateFields.push("status_time = ?")
      params.push(currentTimeInTimezone)
      console.log('🕐 [updateTicketStatus] Also setting status_time (not in update) with timezone:', currentTimeInTimezone);
    }
    
    // Also update calling_user_time if it wasn't already set (for updates that change caller)
    if (!updateFields.some(f => f.includes('calling_user_time'))) {
      updateFields.push("calling_user_time = ?")
      params.push(currentTimeInTimezone)
      console.log('🕐 [updateTicketStatus] Also setting calling_user_time (not in update) with timezone:', currentTimeInTimezone);
    }

    console.log('🕐 [updateTicketStatus] Final update fields:', updateFields);
    console.log('🕐 [updateTicketStatus] Final params:', params.slice(0, -1)); // Don't log ticketId

    const updateQuery = `UPDATE tickets SET ${updateFields.join(", ")} WHERE ticket_id = ?`
    params.push(ticketId)

    const [result] = await connection.query(updateQuery, params)

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" })
    }
    
    // Verify what was actually saved
    const [verifyTicket] = await connection.query(
      "SELECT status_time, calling_user_time, last_updated FROM tickets WHERE ticket_id = ?",
      [ticketId]
    );
    if (verifyTicket.length > 0) {
      console.log('✓ Saved values in database after update:');
      console.log('  status_time:', verifyTicket[0].status_time);
      console.log('  calling_user_time:', verifyTicket[0].calling_user_time);
      console.log('  last_updated:', verifyTicket[0].last_updated);
    }

    res.json({ success: true, message: "Ticket updated" })
  } finally {
    connection.release()
  }
}
