import pool from "../../../config/database.js"

export const getAllAdmins = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const [admins] = await connection.query(
      "SELECT id, username, email FROM admin WHERE role = 'admin'"
    )

    res.json({ success: true, admins })
  } finally {
    connection.release()
  }
}
