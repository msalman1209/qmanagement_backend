import pool from '../../config/database.js';

export const getAllServices = async (req, res) => {
  try {
    // Get admin_id: use admin_id for users with admin permissions, otherwise use user's own id
    const admin_id = req.user.admin_id || req.user.id;
    
    const [services] = await pool.query(
      `SELECT id, service_name, service_name_arabic, initial_ticket, color, logo_url, 
              show_sub_service_popup, created_at, updated_at 
       FROM services 
       WHERE admin_id = ?
       ORDER BY created_at DESC`,
      [admin_id]
    );

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};
