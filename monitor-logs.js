import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function monitorActivityLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n📊 Current Activity Logs Status:\n');
    
    // Total count
    const [total] = await connection.query('SELECT COUNT(*) as count FROM activity_logs');
    console.log(`Total logs in database: ${total[0].count}`);
    
    // Count by admin
    const [byAdmin] = await connection.query(`
      SELECT admin_id, COUNT(*) as count 
      FROM activity_logs 
      GROUP BY admin_id
      ORDER BY admin_id
    `);
    
    console.log('\n📋 Logs by Admin:');
    byAdmin.forEach(row => {
      console.log(`  Admin ${row.admin_id}: ${row.count} logs`);
    });
    
    // Recent 5 logs for admin_id=8
    const [recentAdmin8] = await connection.query(`
      SELECT 
        id,
        user_id,
        user_role,
        activity_type,
        activity_description,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM activity_logs 
      WHERE admin_id = 8
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🕐 Recent 5 logs for Admin #8:');
    if (recentAdmin8.length === 0) {
      console.log('  ❌ No logs found for admin_id=8');
    } else {
      recentAdmin8.forEach((log, i) => {
        console.log(`\n  ${i + 1}. [ID: ${log.id}] ${log.activity_type}`);
        console.log(`     Description: ${log.activity_description}`);
        console.log(`     User: ${log.user_id} (${log.user_role})`);
        console.log(`     Time: ${log.created_at}`);
      });
    }
    
    console.log('\n✅ Monitoring complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

monitorActivityLogs();
