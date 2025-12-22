import pool from "../../config/database.js";
import { logActivity } from "../../routes/activityLogs.js";

export const freshTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { adminId } = req.body;
  const userId = req.user.id;

  console.log(`🔄 [freshTicket] Received request:`, { ticketId, adminId, userId });

  if (!ticketId) {
    return res.status(400).json({ 
      success: false, 
      message: "Ticket ID is required" 
    });
  }

  const connection = await pool.getConnection();
  try {
    console.log(`🔄 [freshTicket] User ${userId} freshing ticket ${ticketId}`);

    // Get ticket details
    const [tickets] = await connection.query(
      `SELECT * FROM tickets WHERE ticket_id = ?`,
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    const ticket = tickets[0];

    // Reset ticket to pending status - only update columns that exist
    const [result] = await connection.query(
      `UPDATE tickets 
       SET status = 'Pending',
           counter_no = NULL,
           caller = NULL,
           representative = NULL,
           representative_id = NULL,
           calling_time = 0,
           locked_by = NULL
       WHERE ticket_id = ?`,
      [ticketId]
    );

    console.log('✅ [freshTicket] Ticket reset to Pending:', result.affectedRows, 'rows affected');

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Failed to fresh ticket"
      });
    }

    // Log activity
    const [userDetails] = await connection.query(
      "SELECT admin_id, role, username FROM users WHERE id = ?",
      [userId]
    );

    if (userDetails.length > 0) {
      const actualAdminId = adminId || userDetails[0].admin_id;
      const username = userDetails[0].username;

      console.log('🎯 [freshTicket] Logging activity...');
      await logActivity(
        actualAdminId,
        userId,
        userDetails[0].role,
        'TICKET_FRESH',
        `Super Admin (${username}) freshed ticket ${ticketId} - reset to Pending`,
        {
          ticket_id: ticketId,
          ticket_number: ticketId,
          previous_status: ticket.status,
          new_status: 'Pending',
          admin_id: actualAdminId
        },
        req
      ).catch(err => console.error('❌ [freshTicket] Failed to log activity:', err));
      console.log('✅ [freshTicket] Activity logged successfully');
    }

    res.json({
      success: true,
      message: "Ticket freshed successfully"
    });
  } catch (error) {
    console.error("[freshTicket] Error:", error);
    console.error("[freshTicket] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fresh ticket",
      error: error.message
    });
  } finally {
    connection.release();
  }
};
