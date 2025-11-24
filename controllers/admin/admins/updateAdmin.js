import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const updateAdmin = async (req, res) => {
  const { adminId } = req.params
  const { username, email, password } = req.body

  const connection = await pool.getConnection()
  try {
    const [admins] = await connection.query("SELECT id FROM admin WHERE id = ? AND role = 'admin'", [adminId])

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    let updateQuery = "UPDATE admin SET username = ?, email = ?"
    const params = [username, email]

    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10)
      updateQuery += ", password = ?"
      params.push(hashedPassword)
    }

    updateQuery += " WHERE id = ?"
    params.push(adminId)

    await connection.query(updateQuery, params)

    res.json({ success: true, message: "Admin updated successfully" })
  } finally {
    connection.release()
  }
}
