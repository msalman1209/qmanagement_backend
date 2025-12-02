import pool from '../config/database.js'

async function checkUsers() {
  const connection = await pool.getConnection()
  try {
    console.log('Checking users in database...\n')

    const [users] = await connection.query('SELECT id, username, email, role FROM users')
    
    console.log('Total users:', users.length)
    console.log('\nUsers list:')
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role || 'NOT SET'}`)
    })

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    connection.release()
    process.exit()
  }
}

checkUsers()
