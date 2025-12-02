import pool from "../../config/database.js";

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
    // Optimized: Get counter number quickly
    const [sessions] = await connection.query(
      "SELECT counter_no FROM user_sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    const counterNo = sessions.length > 0 ? sessions[0].counter_no : null;

    // Send response immediately for faster client response
    res.json({
      success: true,
      message: "Ticket called successfully",
      counterNo
    });

    // Update ticket in background (non-blocking)
    connection.query(
      `UPDATE tickets 
       SET status = 'called', 
           counter_no = ?,
           called_at = NOW()
       WHERE ticket_id = ?`,
      [counterNo, ticketNumber]
    ).catch(err => {
      console.error("[callTicket] Background update error:", err);
    }).finally(() => {
      connection.release();
    });
    
  } catch (error) {
    console.error("[callTicket] Error:", error);
    connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to call ticket"
    });
  }
};
