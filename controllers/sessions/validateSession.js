import pool from "../../config/database.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/auth.js";

// Validate if session is active in database
export const validateSession = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'No token provided'
      });
    }

    // Decode token to get user info
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if session exists and is active in database
    const [sessions] = await pool.query(
      `SELECT session_id, user_id, active, expires_at 
       FROM user_sessions 
       WHERE token = ? AND active = 1 AND expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      console.log('❌ Session not found or inactive for user:', decoded.id);
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Session has been terminated by administrator'
      });
    }

    console.log('✅ Session valid for user:', decoded.id);
    res.json({
      success: true,
      valid: true,
      message: 'Session is active'
    });
  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Failed to validate session',
      error: error.message
    });
  }
};
