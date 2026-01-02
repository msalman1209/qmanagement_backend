import pool from "../../config/database.js"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../../config/auth.js"

// Create admin session
export const createAdminSession = async (adminId, username, role, deviceInfo = null, ipAddress = null) => {
  try {
    // Generate JWT token with 7 days expiry
    const token = jwt.sign(
      { id: adminId, username, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Insert session into database
    const query = `
      INSERT INTO admin_sessions (admin_id, username, role, token, device_info, ip_address, expires_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `

    await pool.query(query, [adminId, username, role, token, deviceInfo, ipAddress, expiresAt])

    return { success: true, token }
  } catch (error) {
    console.error('Error creating admin session:', error)
    return { success: false, error: error.message }
  }
}

// Create user session
export const createUserSession = async (userId, username, email = null, counterNo = null, adminId = null, deviceInfo = null, ipAddress = null, userRole = 'user') => {
  try {
    // Generate JWT token with 7 days expiry - include admin_id and correct role
    const token = jwt.sign(
      { id: userId, username, role: userRole, admin_id: adminId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Insert session into database
    const query = `
      INSERT INTO user_sessions (user_id, username, role, email, counter_no, admin_id, device_id, token, ip_address, login_time, expires_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)
    `

    await pool.query(query, [userId, username, userRole, email, counterNo, adminId, deviceInfo, token, ipAddress, expiresAt])

    return { success: true, token }
  } catch (error) {
    console.error('Error creating user session:', error)
    return { success: false, error: error.message }
  }
}

// Validate admin session
export const validateAdminSession = async (token) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET)
    
    console.log('🔍 [validateAdminSession] Decoded token:', { id: decoded.id, role: decoded.role })

    // Check if session exists and is active in admin_sessions table
    const query = `
      SELECT session_id, admin_id, username, role, expires_at, active
      FROM admin_sessions
      WHERE token = ? AND active = 1 AND expires_at > NOW()
    `

    const [sessions] = await pool.query(query, [token])
    
    console.log('🔍 [validateAdminSession] Admin sessions found:', sessions.length)

    if (sessions.length === 0) {
      // Session not found in admin_sessions, check if it's a user with admin permissions
      console.log('⚠️  [validateAdminSession] Session not found in admin_sessions. Checking users table for user ID:', decoded.id)
      
      // Query users table
      const [userFromDb] = await pool.query('SELECT id, username, admin_id, role, permissions FROM users WHERE id = ?', [decoded.id])
      
      console.log('🔍 [validateAdminSession] Users found:', userFromDb.length)
      
      if (userFromDb.length === 0) {
        console.log('❌ [validateAdminSession] User not found in database')
        return { valid: false, message: 'Invalid or expired session' }
      }
      
      const user = userFromDb[0]
      
      // Parse permissions
      let userPermissions = user.permissions;
      if (typeof userPermissions === 'string') {
        try {
          userPermissions = JSON.parse(userPermissions);
        } catch (e) {
          console.log('❌ [validateAdminSession] Failed to parse permissions')
          userPermissions = null;
        }
      }
      
      console.log('🔍 [validateAdminSession] User permissions:', userPermissions)
      
      // Check if user has admin access
      if (!userPermissions || !userPermissions.canAccessDashboard) {
        console.log('❌ [validateAdminSession] User does not have admin access permission')
        return { valid: false, message: 'Invalid or expired session' }
      }
      
      console.log('✅ [validateAdminSession] User with admin permissions validated:', { id: user.id, username: user.username, admin_id: user.admin_id })
      
      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          role: 'admin', // Return as admin role
          admin_id: user.admin_id // Important: include admin_id
        }
      }
    }

    // Update last activity
    await pool.query(
      'UPDATE admin_sessions SET last_activity = NOW() WHERE session_id = ?',
      [sessions[0].session_id]
    )
    
    console.log('✅ [validateAdminSession] Admin session validated from admin_sessions table')

    // Check if this is a user from users table (not admin table)
    // If yes, get their actual admin_id from users table
    const [userCheck] = await pool.query('SELECT admin_id FROM users WHERE id = ?', [sessions[0].admin_id])
    
    let actualAdminId = sessions[0].admin_id;
    let isUserWithAdminPermissions = false;
    if (userCheck.length > 0 && userCheck[0].admin_id) {
      actualAdminId = userCheck[0].admin_id;
      isUserWithAdminPermissions = true;
      console.log('🔍 [validateAdminSession] User with admin permissions - using admin_id:', actualAdminId, 'instead of user id:', sessions[0].admin_id);
    }

    return {
      valid: true,
      user: {
        id: sessions[0].admin_id,
        username: sessions[0].username,
        role: sessions[0].role,
        email: sessions[0].email,
        // Include admin_id for users with admin permissions
        admin_id: isUserWithAdminPermissions ? actualAdminId : sessions[0].admin_id
      }
    }
  } catch (error) {
    console.error('❌ [validateAdminSession] Error:', error.message)
    return { valid: false, message: 'Session validation failed' }
  }
}

// Validate user session
export const validateUserSession = async (token) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET)
    
    console.log('🔍 [validateUserSession] Checking token in database for user:', decoded.id)

    // Check if session exists and is active - also fetch admin_id and role from users table
    const query = `
      SELECT us.session_id, us.user_id, us.username, us.expires_at, us.active, u.admin_id, u.role
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.token = ? AND us.active = 1 AND us.expires_at > NOW()
    `

    const [sessions] = await pool.query(query, [token])
    
    console.log('🔍 [validateUserSession] Query result - Sessions found:', sessions.length)

    if (sessions.length === 0) {
      console.log('⚠️  [validateUserSession] Session not found in DB or expired. Using JWT decoded data as fallback.')
      // Fallback: If session not in DB, use JWT data (session might be deleted but token still valid)
      // This allows users to continue working even if session DB record is missing
      const [userFromDb] = await pool.query('SELECT id, username, admin_id, role FROM users WHERE id = ?', [decoded.id])
      
      if (userFromDb.length === 0) {
        return { valid: false, message: 'User not found' }
      }
      
      const user = userFromDb[0]
      console.log('✅ [validateUserSession] User found in DB:', { id: user.id, role: user.role, admin_id: user.admin_id })
      
      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,        // Use actual role from users table
          admin_id: user.admin_id // Include admin_id from users table
        }
      }
    }

    // Update last activity
    try {
      await pool.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = ?',
        [sessions[0].session_id]
      )
    } catch (e) {
      console.warn('⚠️  Could not update last_activity:', e.message)
    }

    return {
      valid: true,
      user: {
        id: sessions[0].user_id,
        username: sessions[0].username,
        role: sessions[0].role,        // ✅ Use actual role from users table
        admin_id: sessions[0].admin_id // ✅ Include admin_id from users table
      }
    }
  } catch (error) {
    console.error('❌ [validateUserSession] Error:', error.message)
    return { valid: false, message: 'Session validation failed: ' + error.message }
  }
}

// Logout admin (deactivate session)
// Logout admin (delete session)
export const logoutAdmin = async (token) => {
  try {
    const query = 'DELETE FROM admin_sessions WHERE token = ?'
    const [result] = await pool.query(query, [token])
    
    console.log(`✅ Admin session deleted - ${result.affectedRows} row(s) removed`)
    return { success: true, rowsAffected: result.affectedRows }
  } catch (error) {
    console.error('Error logging out admin:', error)
    return { success: false, error: error.message }
  }
}

// Logout user (delete session)
export const logoutUser = async (token) => {
  try {
    const query = 'DELETE FROM user_sessions WHERE token = ?'
    const [result] = await pool.query(query, [token])
    
    console.log(`✅ User session deleted - ${result.affectedRows} row(s) removed`)
    return { success: true, rowsAffected: result.affectedRows }
  } catch (error) {
    console.error('Error logging out user:', error)
    return { success: false, error: error.message }
  }
}

// Get all active sessions for admin
export const getAdminActiveSessions = async (adminId) => {
  try {
    const query = `
      SELECT session_id, device_info, ip_address, login_time, last_activity
      FROM admin_sessions
      WHERE admin_id = ? AND active = 1 AND expires_at > NOW()
      ORDER BY last_activity DESC
    `

    const [sessions] = await pool.query(query, [adminId])
    return { success: true, sessions }
  } catch (error) {
    console.error('Error getting admin sessions:', error)
    return { success: false, error: error.message }
  }
}

// Get all active sessions for user
export const getUserActiveSessions = async (userId) => {
  try {
    const query = `
      SELECT session_id, device_id, ip_address, login_time, last_activity
      FROM user_sessions
      WHERE user_id = ? AND active = 1 AND expires_at > NOW()
      ORDER BY last_activity DESC
    `

    const [sessions] = await pool.query(query, [userId])
    return { success: true, sessions }
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return { success: false, error: error.message }
  }
}

// Clean up expired sessions
export const cleanupExpiredSessions = async () => {
  try {
    await pool.query('UPDATE admin_sessions SET active = 0 WHERE expires_at < NOW()')
    await pool.query('UPDATE user_sessions SET active = 0 WHERE expires_at < NOW()')
    return { success: true }
  } catch (error) {
    console.error('Error cleaning up sessions:', error)
    return { success: false, error: error.message }
  }
}
