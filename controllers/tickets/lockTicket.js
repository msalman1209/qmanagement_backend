import pool from "../../config/database.js"

export const lockTicket = async (req, res) => {
  const { ticketId } = req.params
  const { user_id, lock, adminId } = req.body
  
  console.log('🔓 [lockTicket] Request:', { ticketId, user_id, lock, adminId })

  const connection = await pool.getConnection()
  try {
    // Start transaction for atomic operation
    await connection.beginTransaction()

    // If locking, check if ticket is already locked with row lock
    if (lock) {
      const [existing] = await connection.query(
        "SELECT locked_by FROM tickets WHERE ticket_id = ? FOR UPDATE",
        [ticketId]
      )

      if (existing.length === 0) {
        await connection.rollback()
        return res.status(404).json({ success: false, message: "Ticket not found" })
      }

      if (existing[0].locked_by && existing[0].locked_by !== 0 && existing[0].locked_by !== user_id) {
        await connection.rollback()
        return res.status(409).json({ success: false, message: "Ticket is already locked by another user" })
      }
    }

    // Get username if locking
    let username = null;
    if (lock && user_id) {
      // For Super Admin mode, get user details including admin_id validation
      const [users] = await connection.query(
        adminId 
          ? "SELECT username FROM users WHERE id = ? AND admin_id = ?"
          : "SELECT username FROM users WHERE id = ?",
        adminId ? [user_id, adminId] : [user_id]
      );
      username = users.length > 0 ? users[0].username : null;
      
      console.log('🎯 [lockTicket - Accept] Updating ticket with:', {
        locked_by: user_id,
        representative: username,
        representative_id: user_id,
        ticket_id: ticketId
      });
    }

    // Lock or unlock the ticket (with representative info when locking)
    const [result] = await connection.query(
      lock 
        ? "UPDATE tickets SET locked_by = ?, representative = ?, representative_id = ? WHERE ticket_id = ?"
        : "UPDATE tickets SET locked_by = ? WHERE ticket_id = ?",
      lock 
        ? [user_id, username, user_id, ticketId]
        : [null, ticketId]
    )

    console.log(`[lockTicket] ${lock ? 'Locked' : 'Unlocked'} ticket ${ticketId} by user ${user_id}, affected rows: ${result.affectedRows}`)

    // Commit transaction
    await connection.commit()

    res.json({ success: true, message: lock ? "Ticket locked" : "Ticket unlocked" })
  } catch (error) {
    await connection.rollback()
    console.error("[lockTicket] error", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  } finally {
    connection.release()
  }
}
