import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"

export const adminLogin = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" })
  }

  const connection = await pool.getConnection()
  try {
    // Check in admin table with role 'admin'
    const [admins] = await connection.query(
      "SELECT * FROM admin WHERE email = ? AND role = 'admin'",
      [email]
    )

    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const admin = admins[0]
    const passwordMatch = await bcryptjs.compare(password, admin.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: "admin",
    })

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: "admin",
      },
    })
  } finally {
    connection.release()
  }
}
