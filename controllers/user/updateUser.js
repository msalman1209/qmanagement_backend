import pool from "../../config/database.js";
import bcrypt from "bcryptjs";

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, password } = req.body;

    console.log('📝 Updating user:', userId);
    console.log('📋 Update data:', { username, email, hasPassword: !!password });

    // Validation
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required"
      });
    }

    // Check if user exists
    const [existingUser] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('👤 Existing user:', existingUser[0]);

    // Build update query dynamically
    let updateQuery = 'UPDATE users SET username = ?, email = ?';
    let updateParams = [username, email];

    // If password is provided, hash it and add to update
    if (password && password.trim() !== '') {
      console.log('🔐 Password update requested');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(userId);

    // Execute update
    await pool.query(updateQuery, updateParams);

    // Fetch updated user
    const [updatedUser] = await pool.query(
      'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    console.log('✅ User updated successfully:', updatedUser[0]);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser[0]
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};
