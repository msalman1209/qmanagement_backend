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
export const createUserSession = async (userId, username, email = null, counterNo = null, adminId = null, deviceInfo = null, ipAddress = null) => {
  try {
    // Generate JWT token with 7 days expiry
    const token = jwt.sign(
      { id: userId, username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Insert session into database
    const query = `
      INSERT INTO user_sessions (user_id, username, email, counter_no, admin_id, device_id, token, ip_address, login_time, expires_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)
    `

    await pool.query(query, [userId, username, email, counterNo, adminId, deviceInfo, token, ipAddress, expiresAt])

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

    // Check if session exists and is active
    const query = `
      SELECT session_id, admin_id, username, role, expires_at, active
      FROM admin_sessions
      WHERE token = ? AND active = 1 AND expires_at > NOW()
    `

    const [sessions] = await pool.query(query, [token])

    if (sessions.length === 0) {
      return { valid: false, message: 'Invalid or expired session' }
    }

    // Update last activity
    await pool.query(
      'UPDATE admin_sessions SET last_activity = NOW() WHERE session_id = ?',
      [sessions[0].session_id]
    )

    return {
      valid: true,
      user: {
        id: sessions[0].admin_id,
        username: sessions[0].username,
        role: sessions[0].role
      }
    }
  } catch (error) {
    console.error('Error validating admin session:', error)
    return { valid: false, message: 'Session validation failed' }
  }
}

// Validate user session
export const validateUserSession = async (token) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    // Check if session exists and is active
    const query = `
      SELECT session_id, user_id, username, expires_at, active
      FROM user_sessions
      WHERE token = ? AND active = 1 AND expires_at > NOW()
    `

    const [sessions] = await pool.query(query, [token])

    if (sessions.length === 0) {
      return { valid: false, message: 'Invalid or expired session' }
    }

    // Update last activity
    await pool.query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = ?',
      [sessions[0].session_id]
    )

    return {
      valid: true,
      user: {
        id: sessions[0].user_id,
        username: sessions[0].username,
        role: 'user'
      }
    }
  } catch (error) {
    console.error('Error validating user session:', error)
    return { valid: false, message: 'Session validation failed' }
  }
}

// Logout admin (deactivate session)
export const logoutAdmin = async (token) => {
  try {
    const query = 'UPDATE admin_sessions SET active = 0 WHERE token = ?'
    await pool.query(query, [token])
    return { success: true }
  } catch (error) {
    console.error('Error logging out admin:', error)
    return { success: false, error: error.message }
  }
}

// Logout user (deactivate session)
export const logoutUser = async (token) => {
  try {
    const query = 'UPDATE user_sessions SET active = 0 WHERE token = ?'
    await pool.query(query, [token])
    return { success: true }
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
