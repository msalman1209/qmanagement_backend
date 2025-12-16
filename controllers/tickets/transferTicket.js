import pool from "../../config/database.js"
import { getAdminTimezone, convertUTCToTimezone } from "../../utils/timezoneHelper.js"

export const transferTicket = async (req, res) => {
  const { ticketId } = req.params
  const { transferred_to, reason, transfer_by } = req.body

  if (!transferred_to) {
    return res.status(400).json({ success: false, message: "Transfer recipient required" })
  }

  const connection = await pool.getConnection()
  try {
    console.log(`[transferTicket] BEFORE UPDATE: ticket=${ticketId}, transferred_to=${transferred_to}, transfer_by=${transfer_by}`)
    
    // Get ticket to find admin_id for timezone
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
    const currentTimeInTimezone = convertUTCToTimezone(now, adminTimezone);
    
    console.log('🕐 [transferTicket] Admin timezone:', adminTimezone, 'Current time:', currentTimeInTimezone);
    
    // Reset ticket status and clear caller/locked_by so it becomes available for the new user
    const [result] = await connection.query(
      `UPDATE tickets 
       SET transfered = ?, 
           transfered_time = ?, 
           reason = ?, 
           transfer_by = ?,
           status = 'Pending',
           caller = NULL,
           locked_by = NULL,
           counter_no = NULL,
           last_updated = ?
       WHERE ticket_id = ?`,
      [transferred_to, currentTimeInTimezone, reason || null, transfer_by || null, currentTimeInTimezone, ticketId]
    )

    console.log(`[transferTicket] AFTER UPDATE: Rows affected=${result.affectedRows}`)
    
    // Verify the update
    const [verify] = await connection.query(
      `SELECT ticket_id, transfered, transfer_by, status, caller FROM tickets WHERE ticket_id = ?`,
      [ticketId]
    )
    
    if (verify.length > 0) {
      console.log(`[transferTicket] VERIFICATION: ticket=${verify[0].ticket_id}, transfered=${verify[0].transfered}, transfer_by=${verify[0].transfer_by}, status=${verify[0].status}, caller=${verify[0].caller}`)
    }
    
    res.json({ success: true, message: "Ticket transferred" })
  } finally {
    connection.release()
  }
}
