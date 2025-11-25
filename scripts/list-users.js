import pool from '../config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function listUsers() {
  const connection = await pool.getConnection()
  try {
    const adminIdArg = process.argv.find(a => a.startsWith('--adminId='))
    const adminId = adminIdArg ? adminIdArg.split('=')[1] : null

    let query = 'SELECT id, username, email, status, admin_id FROM users'
    const params = []
    if (adminId) {
      query += ' WHERE admin_id = ?'
      params.push(adminId)
    }
    query += ' ORDER BY id DESC LIMIT 100'

    const [rows] = await connection.query(query, params)

    console.log('\nUsers' + (adminId ? ` (admin_id=${adminId})` : '') + ':')
    console.table(rows)
    console.log(`\nTotal: ${rows.length}`)
  } catch (err) {
    console.error('Failed to list users:', err.message)
    process.exitCode = 1
  } finally {
    connection.release()
    process.exit()
  }
}

listUsers()
