import pool from '../../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // First get the admin_id of the current user
    const [currentUserData] = await pool.query(
      'SELECT admin_id FROM users WHERE id = ?',
      [userId]
    );

    let admin_id;
    if (currentUserData && currentUserData.length > 0) {
      admin_id = currentUserData[0].admin_id;
    } else {
      // If not found in users table, try admin table for admin/super_admin tokens
      const [adminRows] = await pool.query(
        'SELECT id FROM admin WHERE id = ?',
        [userId]
      );
      if (!adminRows || adminRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      admin_id = adminRows[0].id;
    }

    // Get all users under the same admin (excluding current user) with login status
    const [users] = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.admin_id, 
        u.role, 
        u.status,
        CASE 
          WHEN s.session_id IS NOT NULL THEN 1 
          ELSE 0 
        END as isLoggedIn
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id 
        AND s.active = 1 
        AND s.expires_at > NOW()
      WHERE u.admin_id = ? AND u.id != ? 
      ORDER BY u.username`,
      [admin_id, userId]
    );

    console.log(`[getAllUsers] User ${userId} (admin_id: ${admin_id}) fetched ${users.length} users`);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};
