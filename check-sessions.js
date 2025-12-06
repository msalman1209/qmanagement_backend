import pool from "./config/database.js"

const checkSessions = async () => {
  try {
    console.log('\n📊 Checking user sessions...\n')
    
    const [sessions] = await pool.query(
      'SELECT session_id, user_id, username, token, active, expires_at, created_at FROM user_sessions ORDER BY session_id DESC LIMIT 10'
    )
    
    console.log('Recent Sessions:')
    console.table(sessions.map(s => ({
      id: s.session_id,
      user_id: s.user_id,
      username: s.username,
      token: s.token.substring(0, 20) + '...',
      active: s.active,
      expires_at: s.expires_at,
      created_at: s.created_at
    })))
    
    console.log('\n📊 Active sessions:', sessions.filter(s => s.active === 1).length)
    console.log('📊 Inactive sessions:', sessions.filter(s => s.active === 0).length)
    console.log('📊 Total sessions:', sessions.length)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkSessions()
