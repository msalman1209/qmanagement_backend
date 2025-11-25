import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const createUser = async (req, res) => {
  const { username, email, password, admin_id: bodyAdminId, status } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" })
  }

  // Decide which admin owns this user
  let adminIdToUse = null
  if (req.user?.role === "admin") {
    adminIdToUse = req.user.id
  } else if (req.user?.role === "super_admin" && bodyAdminId) {
    adminIdToUse = bodyAdminId
  }

  const connection = await pool.getConnection()
  try {
    const hashedPassword = await bcryptjs.hash(password, 10)

    await connection.query(
      "INSERT INTO users (username, email, password, admin_id, status) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, adminIdToUse, status || "active"]
    )

    res.status(201).json({ success: true, message: "User created successfully" })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Username or email already exists" })
    }
    console.error("Create user error:", error)
    res.status(500).json({ success: false, message: "Failed to create user" })
  } finally {
    connection.release()
  }
}
