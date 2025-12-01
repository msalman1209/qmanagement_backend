import pool from '../../config/database.js';

export const getUserAssignedServices = async (req, res) => {
  try {
    const userId = req.params.id; // Get user ID from URL params if provided
    
    // If user ID is provided, get services for that specific user
    if (userId) {
      const [services] = await pool.query(`
        SELECT 
          s.id,
          s.service_name,
          s.service_name_arabic,
          s.initial_ticket,
          s.color,
          s.description,
          s.logo_url
        FROM services s
        INNER JOIN user_services us ON s.id = us.service_id
        WHERE us.user_id = ?
        ORDER BY s.service_name
      `, [userId]);

      return res.json({
        success: true,
        services: services
      });
    }

    // Otherwise, get all users with their assigned services (admin view)
    const admin_id = req.user.id;

    // Get only users who have assigned services (with non-null services)
    const [assignments] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        GROUP_CONCAT(s.service_name SEPARATOR ', ') as services,
        GROUP_CONCAT(s.id) as service_ids
      FROM users u
      INNER JOIN user_services us ON u.id = us.user_id
      INNER JOIN services s ON us.service_id = s.id
      WHERE u.admin_id = ? AND s.id IS NOT NULL
      GROUP BY u.id, u.username
      HAVING services IS NOT NULL
      ORDER BY u.username
    `, [admin_id]);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching user assigned services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned services',
      error: error.message
    });
  }
};
