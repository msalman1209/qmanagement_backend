import pool from "./config/database.js"

const clearSessions = async () => {
  try {
    console.log('🧹 Clearing all user sessions...')
    
    const [result] = await pool.query('DELETE FROM user_sessions')
    
    console.log(`✅ Deleted ${result.affectedRows} session(s)`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

clearSessions()
