import pool from "../../config/database.js";
import { logActivity } from "../../routes/activityLogs.js";

export const callTicket = async (req, res) => {
  const { ticketNumber } = req.body;
  const userId = req.user.id;

  if (!ticketNumber) {
    return res.status(400).json({ 
      success: false, 
      message: "Ticket number is required" 
    });
  }

  const connection = await pool.getConnection();
  try {
    // Get user's counter and username - use 'active' column (not is_active)
    const [sessions] = await connection.query(
      "SELECT counter_no FROM user_sessions WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    const counterNo = sessions.length > 0 ? sessions[0].counter_no : null;

    // ✅ CRITICAL: Prevent calling tickets without valid counter
    if (!counterNo || counterNo === null || counterNo === 'null' || counterNo === '') {
      return res.status(400).json({
        success: false,
        message: "❌ You must be assigned to a counter before calling tickets!\n\nPlease log out and log in again, then select a counter.",
        no_counter: true
      });
    }

    // Get username
    const [users] = await connection.query(
      "SELECT username FROM users WHERE id = ?",
      [userId]
    );
    
    const username = users.length > 0 ? users[0].username : null;

    console.log('🎯 [callTicket] Updating ticket with:', {
      status: 'called',
      counter_no: counterNo,
      caller: username,
      representative: username,
      representative_id: userId,
      ticket_id: ticketNumber
    });

    // Get current call count
    const [currentTicket] = await connection.query(
      `SELECT calling_time FROM tickets WHERE ticket_id = ?`,
      [ticketNumber]
    );
    const currentCallCount = currentTicket.length > 0 ? (currentTicket[0].calling_time || 0) : 0;
    const newCallCount = currentCallCount + 1;

    // Update ticket with caller info (don't lock on call, only on accept)
    const [result] = await connection.query(
      `UPDATE tickets 
       SET status = 'called', 
           counter_no = ?,
           caller = ?,
           representative = ?,
           representative_id = ?,
           calling_time = ?,
           called_at = NOW(),
           calling_user_time = NOW(),
           status_time = NOW()
       WHERE ticket_id = ?`,
      [counterNo, username, username, userId, newCallCount, ticketNumber]
    );

    console.log('✅ [callTicket] Update result:', result.affectedRows, 'rows affected');

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Verify the update
    const [verify] = await connection.query(
      `SELECT ticket_id, status, caller, representative, representative_id, locked_by, counter_no FROM tickets WHERE ticket_id = ?`,
      [ticketNumber]
    );
    
    console.log(`🔍 [callTicket] User ${userId} (${username}) called ticket ${ticketNumber}`);
    console.log(`📋 [callTicket] Verification:`, verify[0]);
    
    // Log activity
    const [userDetails] = await connection.query(
      "SELECT admin_id, role FROM users WHERE id = ?",
      [userId]
    );
    
    if (userDetails.length > 0) {
      const actorInfo = userDetails[0].role === 'receptionist' 
        ? `Receptionist (${username})` 
        : userDetails[0].role === 'user' 
          ? `User (${username})`
          : username;
      
      console.log('🎯 [callTicket] Logging activity...');
      await logActivity(
        userDetails[0].admin_id,
        userId,
        userDetails[0].role,
        'TICKET_CALLED',
        `${actorInfo} called ticket ${ticketNumber} to counter ${counterNo}`,
        {
          ticket_id: ticketNumber,
          ticket_number: ticketNumber,
          counter: counterNo,
          called_by: username,
          caller_role: userDetails[0].role,
          call_count: newCallCount
        },
        req
      ).catch(err => console.error('❌ [callTicket] Failed to log activity:', err));
      console.log('✅ [callTicket] Activity logged successfully');
    }
    
    res.json({
      success: true,
      message: "Ticket called successfully",
      counterNo
    });
  } catch (error) {
    console.error("[callTicket] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to call ticket"
    });
  } finally {
    connection.release();
  }
};
