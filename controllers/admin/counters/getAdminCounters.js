import pool from "../../../config/database.js"

export const getAdminCounters = async (req, res) => {
  const { adminId } = req.params

  if (!adminId) {
    return res.status(400).json({ success: false, message: "Admin ID required" })
  }

  const connection = await pool.getConnection()
  try {
    // Get max_counters for this admin from license table
    const [licenseData] = await connection.query(
      `SELECT max_counters FROM licenses WHERE admin_id = ? AND status = 'active' LIMIT 1`,
      [adminId]
    )

    if (licenseData.length === 0) {
      return res.status(404).json({ success: false, message: "No active license found for this admin" })
    }

    const totalCounters = licenseData[0].max_counters || 5 // Default 5 counters

    // Get currently active counters (logged in users)
    const [activeCounters] = await connection.query(
      `SELECT DISTINCT counter_no, username, email 
       FROM user_sessions 
       WHERE admin_id = ? 
       AND is_active = 1 
       AND counter_no IS NOT NULL
       ORDER BY counter_no ASC`,
      [adminId]
    )

    // Create counter array with status
    const counters = []
    const activeCounterMap = {}
    
    activeCounters.forEach(ac => {
      activeCounterMap[ac.counter_no] = {
        username: ac.username,
        email: ac.email
      }
    })

    for (let i = 1; i <= totalCounters; i++) {
      counters.push({
        counter_no: i,
        isOccupied: !!activeCounterMap[i],
        occupiedBy: activeCounterMap[i] || null
      })
    }

    res.json({ 
      success: true, 
      counters,
      totalCounters
    })
  } catch (error) {
    console.error("[getAdminCounters] error", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  } finally {
    connection.release()
  }
}
