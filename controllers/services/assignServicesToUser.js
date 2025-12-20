import pool from '../../config/database.js';
import { logActivity } from '../../routes/activityLogs.js';

export const assignServicesToUser = async (req, res) => {
  try {
    const { user_id, service_ids, admin_id } = req.body;
    // Use admin_id from request body if provided, otherwise use logged-in user's admin_id (or id for actual admins)
    const finalAdminId = admin_id || req.user.admin_id || req.user.id;

    if (!user_id || !service_ids || !Array.isArray(service_ids)) {
      return res.status(400).json({
        success: false,
        message: 'user_id and service_ids array are required'
      });
    }

    // Verify user belongs to this admin
    const [users] = await pool.query('SELECT id FROM users WHERE id = ? AND admin_id = ?', [user_id, finalAdminId]);
    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User not found or unauthorized'
      });
    }

    // Get target user details for logging
    const [targetUserInfo] = await pool.query(
      'SELECT username, role FROM users WHERE id = ?', 
      [user_id]
    );
    const targetUsername = targetUserInfo[0]?.username || 'Unknown User';
    const targetRole = targetUserInfo[0]?.role || 'user';

    // Get service names for logging
    let serviceNames = [];
    if (service_ids.length > 0) {
      const [services] = await pool.query(
        'SELECT service_name FROM services WHERE id IN (?) AND admin_id = ?',
        [service_ids, finalAdminId]
      );
      serviceNames = services.map(s => s.service_name);
    }

    // Delete existing assignments for this user
    await pool.query('DELETE FROM user_services WHERE user_id = ?', [user_id]);

    // Insert new assignments
    if (service_ids.length > 0) {
      const values = service_ids.map(service_id => [user_id, service_id]);
      await pool.query('INSERT INTO user_services (user_id, service_id) VALUES ?', [values]);
    }

    // Log activity with detailed information
    const actorInfo = req.user?.role === 'super_admin' 
      ? `Super Admin (${req.user.username})` 
      : req.user?.role === 'admin' 
        ? `Admin (${req.user.username})`
        : req.user?.role === 'receptionist'
          ? `Receptionist (${req.user.username})`
          : req.user?.username || 'System';
    
    const serviceList = serviceNames.length > 0 
      ? serviceNames.join(', ') 
      : 'No services';
    
    const activityDescription = service_ids.length > 0
      ? `${actorInfo} assigned ${service_ids.length} service(s) to ${targetRole} ${targetUsername}: ${serviceList}`
      : `${actorInfo} removed all service assignments from ${targetRole} ${targetUsername}`;

    await logActivity(
      finalAdminId,
      req.user?.id || null,
      req.user?.role || 'admin',
      'SERVICES_ASSIGNED',
      activityDescription,
      {
        target_user_id: user_id,
        target_username: targetUsername,
        target_role: targetRole,
        service_ids: service_ids,
        service_names: serviceNames,
        service_count: service_ids.length,
        assigned_by: req.user?.username || 'System',
        assigned_by_role: req.user?.role || 'admin',
        assigned_by_id: req.user?.id || null,
        is_super_admin: req.user?.role === 'super_admin',
        admin_id: finalAdminId
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    res.json({
      success: true,
      message: 'Services assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign services',
      error: error.message
    });
  }
};
