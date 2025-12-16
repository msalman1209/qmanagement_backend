import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorize } from '../middlewares/auth.js';
import { getAdminTimezone, getCurrentTimeInTimezone } from '../utils/timezoneHelper.js';

const router = express.Router();

// Middleware to log activities
async function logActivity(adminId, userId, userRole, activityType, description, metadata = null, req = null) {
  try {
    console.log('📝 [logActivity] Called with:', { adminId, userId, userRole, activityType, description });
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    // Get admin's timezone and convert current time to their timezone
    const adminTimezone = await getAdminTimezone(adminId);
    const activityTime = getCurrentTimeInTimezone(adminTimezone);
    console.log('🕐 [logActivity] Admin timezone:', adminTimezone, 'Activity time:', activityTime);

    const [result] = await db.query(
      `INSERT INTO activity_logs 
      (admin_id, user_id, user_role, activity_type, activity_description, ip_address, user_agent, metadata, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminId, userId, userRole, activityType, description, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null, activityTime]
    );
    console.log('✅ [logActivity] Successfully logged activity, insertId:', result.insertId);
  } catch (error) {
    console.error('❌ [logActivity] Error logging activity:', error);
    console.error('❌ [logActivity] Error details:', error.message);
  }
}

// GET - Fetch all activity logs for an admin
router.get('/admin/:adminId', authenticateToken, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    console.log('📋 [Activity Logs] Fetching logs for admin:', adminId);
    const { 
      page = 1, 
      limit = 50, 
      activityType, 
      userRole,
      startDate,
      endDate,
      search 
    } = req.query;
    console.log('📋 [Activity Logs] Query params:', { page, limit, activityType, userRole, startDate, endDate, search });

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['al.admin_id = ?'];
    let queryParams = [adminId];

    if (activityType && activityType !== 'all') {
      whereConditions.push('al.activity_type = ?');
      queryParams.push(activityType);
    }

    if (userRole && userRole !== 'all') {
      whereConditions.push('al.user_role = ?');
      queryParams.push(userRole);
    }

    if (startDate) {
      whereConditions.push('al.created_at >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('al.created_at <= ?');
      queryParams.push(endDate);
    }

    if (search) {
      whereConditions.push('al.activity_description LIKE ?');
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM activity_logs al 
       WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    console.log('📋 [Activity Logs] Total logs found:', total);

    // Get logs
    const logsQueryParams = [...queryParams, parseInt(limit), offset];
    
    const [logs] = await db.query(
      `SELECT al.*
       FROM activity_logs al
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      logsQueryParams
    );

    // Enrich logs with user details
    for (let log of logs) {
      if (log.user_id) {
        if (log.user_role === 'admin' || log.user_role === 'super_admin') {
          const [adminDetails] = await db.query('SELECT username, email FROM admin WHERE id = ?', [log.user_id]);
          if (adminDetails.length > 0) {
            log.username = adminDetails[0].username;
            log.email = adminDetails[0].email;
          }
        } else {
          const [userDetails] = await db.query('SELECT username, email FROM users WHERE id = ?', [log.user_id]);
          if (userDetails.length > 0) {
            log.username = userDetails[0].username;
            log.email = userDetails[0].email;
          }
        }
      }
    }

    // Parse JSON metadata (only if it's a string)
    const logsWithParsedMetadata = logs.map(log => {
      try {
        return {
          ...log,
          metadata: log.metadata && typeof log.metadata === 'string' 
            ? JSON.parse(log.metadata) 
            : log.metadata
        };
      } catch (err) {
        console.error('❌ [Activity Logs] Error parsing metadata for log ID:', log.id, err);
        return {
          ...log,
          metadata: null
        };
      }
    });

    res.json({
      success: true,
      data: {
        logs: logsWithParsedMetadata,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ [Activity Logs] Error fetching activity logs:', error);
    console.error('❌ [Activity Logs] Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity logs',
      error: error.message 
    });
  }
});

// GET - Fetch activity statistics for an admin
router.get('/admin/:adminId/stats', authenticateToken, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    console.log('📊 [Activity Stats] Fetching stats for admin:', adminId);
    const { startDate, endDate } = req.query;
    console.log('📊 [Activity Stats] Date range:', { startDate, endDate });

    let dateCondition = '';
    let queryParams = [adminId];

    if (startDate && endDate) {
      dateCondition = 'AND created_at BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    // Get activity counts by type
    const [activityCounts] = await db.query(
      `SELECT 
        activity_type,
        COUNT(*) as count
       FROM activity_logs
       WHERE admin_id = ? ${dateCondition}
       GROUP BY activity_type
       ORDER BY count DESC`,
      queryParams
    );

    // Get activity counts by user role
    const [roleCounts] = await db.query(
      `SELECT 
        user_role,
        COUNT(*) as count
       FROM activity_logs
       WHERE admin_id = ? ${dateCondition}
       GROUP BY user_role
       ORDER BY count DESC`,
      queryParams
    );

    // Get most active users
    const [activeUsers] = await db.query(
      `SELECT 
        al.user_id as id,
        al.user_role as role,
        COUNT(al.id) as activity_count
       FROM activity_logs al
       WHERE al.admin_id = ? ${dateCondition}
       GROUP BY al.user_id, al.user_role
       ORDER BY activity_count DESC
       LIMIT 10`,
      queryParams
    );
    
    // Enrich with user details
    for (let user of activeUsers) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        const [adminDetails] = await db.query('SELECT username, email FROM admin WHERE id = ?', [user.id]);
        if (adminDetails.length > 0) {
          user.username = adminDetails[0].username;
          user.email = adminDetails[0].email;
        }
      } else {
        const [userDetails] = await db.query('SELECT username, email FROM users WHERE id = ?', [user.id]);
        if (userDetails.length > 0) {
          user.username = userDetails[0].username;
          user.email = userDetails[0].email;
        }
      }
    }

    // Get recent activities
    const [recentActivities] = await db.query(
      `SELECT al.*
       FROM activity_logs al
       WHERE al.admin_id = ? ${dateCondition}
       ORDER BY al.created_at DESC
       LIMIT 10`,
      queryParams
    );
    
    // Enrich recent activities with user details
    for (let activity of recentActivities) {
      if (activity.user_id) {
        if (activity.user_role === 'admin' || activity.user_role === 'super_admin') {
          const [adminDetails] = await db.query('SELECT username, email FROM admin WHERE id = ?', [activity.user_id]);
          if (adminDetails.length > 0) {
            activity.username = adminDetails[0].username;
            activity.email = adminDetails[0].email;
          }
        } else {
          const [userDetails] = await db.query('SELECT username, email FROM users WHERE id = ?', [activity.user_id]);
          if (userDetails.length > 0) {
            activity.username = userDetails[0].username;
            activity.email = userDetails[0].email;
          }
        }
      }
      // Parse metadata (only if it's a string)
      if (activity.metadata) {
        try {
          activity.metadata = typeof activity.metadata === 'string' 
            ? JSON.parse(activity.metadata) 
            : activity.metadata;
        } catch (err) {
          console.error('❌ [Activity Stats] Error parsing metadata for activity ID:', activity.id, err);
          activity.metadata = null;
        }
      }
    }

    res.json({
      success: true,
      data: {
        activityCounts,
        roleCounts,
        activeUsers,
        recentActivities
      }
    });
  } catch (error) {
    console.error('❌ [Activity Stats] Error fetching activity stats:', error);
    console.error('❌ [Activity Stats] Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity stats',
      error: error.message 
    });
  }
});

// POST - Create a new activity log
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const { adminId, userId, userRole, activityType, description, metadata } = req.body;

    if (!adminId || !activityType || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin ID, activity type, and description are required' 
      });
    }

    await logActivity(adminId, userId, userRole, activityType, description, metadata, req);

    res.json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to log activity',
      error: error.message 
    });
  }
});

// DELETE - Clear old logs (older than X days)
router.delete('/admin/:adminId/cleanup', authenticateToken, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { days = 90 } = req.query;

    const [result] = await db.query(
      `DELETE FROM activity_logs 
       WHERE admin_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [adminId, days]
    );

    res.json({
      success: true,
      message: `Deleted ${result.affectedRows} old activity logs`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup logs',
      error: error.message 
    });
  }
});

export { router as default, logActivity };
