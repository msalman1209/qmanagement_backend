import pool from "../../config/database.js"

/**
 * Get available counters for user's admin
 * Returns list of all counters with their occupied status
 */
export const getAvailableCounters = async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get user's admin_id
    const [users] = await pool.query(
      "SELECT admin_id FROM users WHERE id = ?",
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      })
    }

    const adminId = users[0].admin_id

    if (!adminId) {
      return res.status(400).json({ 
        success: false, 
        message: "User is not assigned to any admin" 
      })
    }

    // Get license info to know max counters allowed
    const [licenses] = await pool.query(
      "SELECT max_counters FROM licenses WHERE admin_id = ? AND status = 'active'",
      [adminId]
    )

    const maxCounters = licenses.length > 0 ? licenses[0].max_counters : 10

    // Get currently occupied counters from active sessions
    const [occupiedCounters] = await pool.query(
      `SELECT DISTINCT counter_no, username 
       FROM user_sessions 
       WHERE admin_id = ? 
         AND active = 1 
         AND expires_at > NOW() 
         AND counter_no IS NOT NULL`,
      [adminId]
    )

    const occupiedCounterNos = new Set(occupiedCounters.map(c => c.counter_no))

    // Generate list of all counters (1 to maxCounters)
    const counters = []
    for (let i = 1; i <= maxCounters; i++) {
      const isOccupied = occupiedCounterNos.has(String(i))
      counters.push({
        counter_no: i,
        isOccupied,
        occupiedBy: isOccupied 
          ? occupiedCounters.find(c => c.counter_no === String(i))?.username 
          : null
      })
    }

    res.json({
      success: true,
      counters,
      totalCounters: maxCounters,
      availableCounters: counters.filter(c => !c.isOccupied).length
    })

  } catch (error) {
    console.error("Error getting available counters:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to get counters",
      error: error.message 
    })
  }
}
