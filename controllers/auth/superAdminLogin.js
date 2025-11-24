import pool from "../../config/database.js"
import { generateToken } from "../../config/auth.js"
import bcryptjs from "bcryptjs"

export const superAdminLogin = async (req, res) => {
  const { email, password } = req.body

  console.log("🔐 Super Admin Login Attempt:");
  console.log("   Email:", email);
  console.log("   Password length:", password?.length);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" })
  }

  const connection = await pool.getConnection()
  try {
    // Check in admin table with role 'super_admin'
    const [admins] = await connection.query(
      "SELECT * FROM admin WHERE email = ? AND role = 'super_admin'",
      [email]
    )

    console.log("   Found admins:", admins.length);
    
    if (admins.length === 0) {
      console.log("   ❌ No super admin found with email:", email);
      
      // Show all super admins for debugging
      const [allSuperAdmins] = await connection.query(
        "SELECT email, username, role FROM admin WHERE role = 'super_admin'"
      );
      console.log("   Available super admins:", allSuperAdmins);
      
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const admin = admins[0]
    console.log("   Testing password for admin:", admin.username);
    
    const passwordMatch = await bcryptjs.compare(password, admin.password)
    
    console.log("   Password match:", passwordMatch);

    if (!passwordMatch) {
      console.log("   ❌ Password mismatch for:", admin.email);
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }
    
    console.log("   ✅ Login successful for:", admin.email);

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: "super_admin",
    })

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: "super_admin",
      },
    })
  } finally {
    connection.release()
  }
}
