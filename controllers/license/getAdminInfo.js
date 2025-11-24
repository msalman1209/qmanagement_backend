import pool from "../../config/database.js"

export const getAdminInfo = async (req, res) => {
  const { adminId } = req.params

  const connection = await pool.getConnection()
  try {
    const [admins] = await connection.query(
      "SELECT id, email, username FROM admin WHERE id = ? AND role = 'admin'",
      [adminId]
    )

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    res.json({ success: true, admin: admins[0] })
  } finally {
    connection.release()
  }
}
