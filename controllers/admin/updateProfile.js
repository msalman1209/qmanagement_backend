import pool from "../../config/database.js"
import bcryptjs from "bcryptjs"

export const updateProfile = async (req, res) => {
  const userId = req.user.id // Get logged-in user's ID from token
  const { username, email, password } = req.body

  const connection = await pool.getConnection()
  try {
    // Verify the user exists
    const [users] = await connection.query(
      "SELECT id FROM admin WHERE id = ?", 
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Check if email is already taken by another user
    if (email) {
      const [emailCheck] = await connection.query(
        "SELECT id FROM admin WHERE email = ? AND id != ?",
        [email, userId]
      )
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Email already in use by another user" 
        })
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const [usernameCheck] = await connection.query(
        "SELECT id FROM admin WHERE username = ? AND id != ?",
        [username, userId]
      )
      
      if (usernameCheck.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Username already in use by another user" 
        })
      }
    }

    let updateQuery = "UPDATE admin SET username = ?, email = ?"
    const params = [username, email]

    // Only update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcryptjs.hash(password, 10)
      updateQuery += ", password = ?"
      params.push(hashedPassword)
    }

    updateQuery += " WHERE id = ?"
    params.push(userId)

    await connection.query(updateQuery, params)

    // Fetch updated user data (without password)
    // Try to get role column if it exists, otherwise just get basic fields
    const [updatedUser] = await connection.query(
      "SELECT id, username, email FROM admin WHERE id = ?",
      [userId]
    )

    // Add role from the token since it's always available there
    const user = {
      ...updatedUser[0],
      role: req.user.role
    }

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to update profile" 
    })
  } finally {
    connection.release()
  }
}
