import pool from "../../config/database.js";

// Helper function to parse device info
const parseDeviceInfo = (userAgent) => {
  if (!userAgent || userAgent === 'Unknown') return 'Unknown';
  
  // Check for mobile devices
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    // Extract mobile device model
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) {
      // Try to extract Android device model
      const modelMatch = userAgent.match(/Android.*;\s*([^)]+)\s*Build/);
      if (modelMatch && modelMatch[1]) {
        return `Android - ${modelMatch[1].trim()}`;
      }
      return 'Android Device';
    }
    return 'Mobile Device';
  }
  
  // For desktop/web browsers
  if (/Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)) return 'Web - Chrome';
  if (/Firefox/i.test(userAgent)) return 'Web - Firefox';
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Web - Safari';
  if (/Edge|Edg/i.test(userAgent)) return 'Web - Edge';
  if (/Opera|OPR/i.test(userAgent)) return 'Web - Opera';
  
  return 'Web Browser';
};

// Get ticket_info sessions
export const getTicketInfoSessions = async (req, res) => {
  const { admin_id } = req.params;
  
  console.log('🔍 [getTicketInfoSessions] Admin ID:', admin_id);
  
  try {
    const [sessions] = await pool.query(`
      SELECT 
        us.session_id as id,
        us.user_id,
        us.username,
        us.email,
        us.login_time,
        us.role as session_role,
        COALESCE(us.device_info, us.device_id) as device_raw,
        us.ip_address,
        us.active,
        us.expires_at,
        u.role as user_role
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.role = 'ticket_info'
        AND u.admin_id = ?
        AND us.active = 1
        AND us.expires_at > NOW()
      ORDER BY us.login_time DESC
    `, [admin_id]);
    
    console.log('✅ [getTicketInfoSessions] Found sessions:', sessions.length);

    // Parse device info for each session
    const parsedSessions = sessions.map(session => ({
      ...session,
      device_info: parseDeviceInfo(session.device_raw),
      device_raw: undefined // Remove raw data from response
    }));

    res.json({
      success: true,
      sessions: parsedSessions
    });
  } catch (error) {
    console.error('Error fetching ticket_info sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// Get receptionist sessions
export const getReceptionistSessions = async (req, res) => {
  const { admin_id } = req.params;
  
  console.log('🔍 [getReceptionistSessions] Admin ID:', admin_id);
  
  try {
    const [sessions] = await pool.query(`
      SELECT 
        us.session_id as id,
        us.user_id,
        us.username,
        us.email,
        us.login_time,
        us.role as session_role,
        COALESCE(us.device_info, us.device_id) as device_raw,
        us.ip_address,
        us.active,
        us.expires_at,
        u.role as user_role
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.role = 'receptionist'
        AND u.admin_id = ?
        AND us.active = 1
        AND us.expires_at > NOW()
      ORDER BY us.login_time DESC
    `, [admin_id]);
    
    console.log('✅ [getReceptionistSessions] Found sessions:', sessions.length);

    // Parse device info for each session
    const parsedSessions = sessions.map(session => ({
      ...session,
      device_info: parseDeviceInfo(session.device_raw),
      device_raw: undefined // Remove raw data from response
    }));

    res.json({
      success: true,
      sessions: parsedSessions
    });
  } catch (error) {
    console.error('Error fetching receptionist sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// Delete session by ID
export const deleteSession = async (req, res) => {
  const { session_id } = req.params;
  
  try {
    const [result] = await pool.query(`
      UPDATE user_sessions 
      SET active = 0
      WHERE session_id = ?
    `, [session_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
};
