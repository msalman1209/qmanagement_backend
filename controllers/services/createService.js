import pool from '../../config/database.js';
import { logActivity } from '../../routes/activityLogs.js';

export const createService = async (req, res) => {
  try {
    console.log('📥 Create Service Request:');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { service_name, service_name_arabic, initial_ticket, color, admin_id } = req.body;
    // Use admin_id from request body if provided, otherwise use logged-in user's admin_id (or id for actual admins)
    const finalAdminId = admin_id || req.user.admin_id || req.user.id;
    
    // Get logo path from uploaded file
    const logo_url = req.file ? `/uploads/services/${req.file.filename}` : null;
    
    console.log('💾 Saving to database:');
    console.log('- Service Name:', service_name);
    console.log('- Logo URL:', logo_url);
    console.log('- Admin ID:', finalAdminId);

    const [result] = await pool.query(
      `INSERT INTO services (admin_id, service_name, service_name_arabic, initial_ticket, color, logo_url, show_sub_service_popup) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [finalAdminId, service_name, service_name_arabic, initial_ticket, color, logo_url]
    );
    
    console.log('✅ Service created successfully with ID:', result.insertId);
    console.log('✅ Logo URL saved:', logo_url);

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
      'SERVICE_CREATED',
      `${actorInfo} created new service: ${service_name}`,
      {
        service_id: result.insertId,
        service_name,
        initial_ticket,
        color,
        created_by: req.user?.username || 'System',
        creator_role: req.user?.role || 'admin'
      },
      req
    ).catch(err => console.error('Failed to log activity:', err));

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: result.insertId,
        service_name,
        service_name_arabic,
        initial_ticket,
        color,
        logo_url
      }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};
