import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const createAdmin = async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" })
  }

  const connection = await pool.getConnection()
  try {
    const hashedPassword = await bcryptjs.hash(password, 10)

    await connection.query(
      "INSERT INTO admin (username, email, password, role) VALUES (?, ?, ?, 'admin')",
      [username, email, hashedPassword]
    )

    res.status(201).json({ success: true, message: "Admin created successfully" })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Username or email already exists" })
    }
    throw error
  } finally {
    connection.release()
  }
}
