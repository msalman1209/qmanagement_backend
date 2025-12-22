import pool from '../../config/database.js';

export const getAdminUsers = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    // Get all users under the specified admin with login status
    const [users] = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.admin_id, 
        u.role, 
        u.status,
        u.permissions,
        CASE 
          WHEN s.session_id IS NOT NULL THEN 1 
          ELSE 0 
        END as isLoggedIn
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id 
        AND s.active = 1 
        AND s.expires_at > NOW()
      WHERE u.admin_id = ? 
      ORDER BY u.username`,
      [adminId]
    );

    console.log(`[getAdminUsers] Fetched ${users.length} users for admin ${adminId}`);
    
    // 🔍 Debug: Log first user's permissions
    if (users.length > 0) {
      console.log('📋 [getAdminUsers] Sample user permissions:', {
        id: users[0].id,
        username: users[0].username,
        permissions_type: typeof users[0].permissions,
        permissions_value: users[0].permissions
      });
    }

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin users',
      error: error.message
    });
  }
};
