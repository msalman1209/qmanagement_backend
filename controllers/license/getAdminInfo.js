import pool from "../../config/database.js"

export const getAdminInfo = async (req, res) => {
  const { adminId } = req.params

  const connection = await pool.getConnection()
  try {
    const [admins] = await connection.query(
      `SELECT 
        id, 
        email, 
        username
      FROM admin 
      WHERE id = ?`,
      [adminId]
    )

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    res.json({ success: true, data: admins[0] })
  } catch (error) {
    console.error('Get admin info error:', error)
    res.status(500).json({ success: false, message: "Failed to fetch admin info", error: error.message })
  } finally {
    connection.release()
  }
}
