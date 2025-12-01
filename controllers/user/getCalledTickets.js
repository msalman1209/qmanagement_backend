import pool from "../../config/database.js";

export const getCalledTickets = async (req, res) => {
  const userId = req.user.id;

  const connection = await pool.getConnection();
  try {
    // Get user's admin_id
    const [users] = await connection.query(
      "SELECT admin_id FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const adminId = users[0].admin_id;

    // Get called tickets (today only)
    // Note: If admin_id column exists in tickets table, filter by it
    const [tickets] = await connection.query(
      `SELECT 
        t.ticket_id as ticket_number,
        t.counter_no,
        t.called_at,
        t.service_name,
        t.representative as called_by
       FROM tickets t
       WHERE t.status = 'called'
       AND DATE(t.called_at) = CURDATE()
       ORDER BY t.called_at DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error("[getCalledTickets] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch called tickets"
    });
  } finally {
    connection.release();
  }
};
