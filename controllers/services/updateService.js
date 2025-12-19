import pool from '../../config/database.js';
import { logActivity } from '../../routes/activityLogs.js';

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, service_name_arabic, initial_ticket, color, admin_id } = req.body;
    // Use admin_id from request body if provided, otherwise use logged-in user's admin_id (or id for actual admins)
    const finalAdminId = admin_id || req.user.admin_id || req.user.id;
    
    // Get logo path from uploaded file if new file is uploaded
    const logo_url = req.file ? `/uploads/services/${req.file.filename}` : undefined;

    let query = `UPDATE services SET service_name = ?, service_name_arabic = ?, initial_ticket = ?, color = ?`;
    let params = [service_name, service_name_arabic, initial_ticket, color];

    if (logo_url) {
      query += `, logo_url = ?`;
      params.push(logo_url);
    }

    query += ` WHERE id = ? AND admin_id = ?`;
    params.push(id, finalAdminId);

    await pool.query(query, params);

    // Log activity
    const actorInfo = req.user?.role === 'super_admin' 
      ? `Super Admin (${req.user.username})` 
      : req.user?.role === 'admin' 
        ? `Admin (${req.user.username})`
        : 'System';
    
    await logActivity(
      finalAdminId,
      req.user?.id || null,
      req.user?.role || 'admin',
      'SERVICE_UPDATED',
      `${actorInfo} updated service: ${service_name}`,
      {
        service_id: id,
        service_name,
        initial_ticket,
        color,
        updated_by: req.user?.username || 'System',
        updater_role: req.user?.role || 'admin'
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    res.json({
      success: true,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};
