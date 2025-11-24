import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"

export const userLogin = async (req, res) => {
  const { email, password, counter_no } = req.body

  if (!email || !password || !counter_no) {
    return res.status(400).json({ success: false, message: "Email, password, and counter number required" })
  }

  const connection = await pool.getConnection()
  try {
    const [users] = await connection.query("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const user = users[0]
    const passwordMatch = await bcryptjs.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Check if user already logged in
    const [sessions] = await connection.query(
      "SELECT * FROM user_sessions WHERE user_id = ?",
      [user.id]
    )

    if (sessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You are already logged in. Please log out first.`,
        already_logged_in: true,
      })
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: "user",
    })

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: "user",
      },
    })
  } finally {
    connection.release()
  }
}
