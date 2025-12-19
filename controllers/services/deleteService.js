import pool from '../../config/database.js';
import { logActivity } from '../../routes/activityLogs.js';

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    // Get admin_id: use admin_id for users with admin permissions, otherwise use user's own id
    const admin_id = req.user.admin_id || req.user.id;

    // Get service details before deleting
    const [services] = await pool.query('SELECT service_name FROM services WHERE id = ? AND admin_id = ?', [id, admin_id]);
    const serviceName = services[0]?.service_name || 'Unknown';

    await pool.query('DELETE FROM services WHERE id = ? AND admin_id = ?', [id, admin_id]);

    // Log activity
    const actorInfo = req.user?.role === 'super_admin' 
      ? `Super Admin (${req.user.username})` 
      : req.user?.role === 'admin' 
        ? `Admin (${req.user.username})`
        : 'System';
    
    await logActivity(
      admin_id,
      req.user?.id || null,
      req.user?.role || 'admin',
      'SERVICE_DELETED',
      `${actorInfo} deleted service: ${serviceName}`,
      {
        service_id: id,
        service_name: serviceName,
        deleted_by: req.user?.username || 'System',
        deleter_role: req.user?.role || 'admin'
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};
