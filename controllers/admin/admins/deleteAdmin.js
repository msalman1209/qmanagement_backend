import pool from "../../../config/database.js"

export const deleteAdmin = async (req, res) => {
  const { adminId } = req.params

  const connection = await pool.getConnection()
  try {
    const [admins] = await connection.query("SELECT id FROM admin WHERE id = ? AND role = 'admin'", [adminId])

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    await connection.query("DELETE FROM admin WHERE id = ?", [adminId])

    res.json({ success: true, message: "Admin deleted successfully" })
  } finally {
    connection.release()
  }
}
