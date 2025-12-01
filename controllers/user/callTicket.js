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
    // Get user's counter from session
    const [sessions] = await connection.query(
      "SELECT counter_no FROM user_sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    const counterNo = sessions.length > 0 ? sessions[0].counter_no : null;

    // Update ticket status and counter (always update called_at to allow re-calling)
    const [result] = await connection.query(
      `UPDATE tickets 
       SET status = 'called', 
           counter_no = ?,
           called_at = NOW()
       WHERE ticket_id = ?`,
      [counterNo, ticketNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
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
