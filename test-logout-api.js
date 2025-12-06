import axios from 'axios';

// Test logout API with a real token
const testLogout = async () => {
  try {
    // Get the latest session token from database
    const { default: pool } = await import('./config/database.js');
    
    const [sessions] = await pool.query(
      'SELECT token FROM user_sessions WHERE active = 1 ORDER BY session_id DESC LIMIT 1'
    );
    
    if (sessions.length === 0) {
      console.log('❌ No active session found in database');
      process.exit(1);
    }
    
    const token = sessions[0].token;
    console.log('🔑 Found token:', token.substring(0, 30) + '...');
    
    // Call logout API
    console.log('🔴 Calling logout API...');
    const response = await axios.post('http://localhost:5000/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Logout API Response:', response.data);
    
    // Check if session was deleted
    const [afterSessions] = await pool.query(
      'SELECT * FROM user_sessions WHERE token = ?',
      [token]
    );
    
    if (afterSessions.length === 0) {
      console.log('✅ Session successfully DELETED from database');
    } else {
      console.log('❌ Session still exists:', afterSessions[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
};

testLogout();
