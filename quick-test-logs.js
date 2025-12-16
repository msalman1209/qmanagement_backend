import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function quickTestLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n🔍 Checking existing logs...\n');
    
    // Check all logs
    const [allLogs] = await connection.query('SELECT COUNT(*) as total FROM activity_logs');
    console.log(`📊 Total logs in database: ${allLogs[0].total}`);
    
    // Check logs by admin
    const [adminLogs] = await connection.query(`
      SELECT admin_id, COUNT(*) as count 
      FROM activity_logs 
      GROUP BY admin_id
    `);
    
    console.log('\n📋 Logs by Admin:');
    adminLogs.forEach(row => {
      console.log(`  Admin ${row.admin_id}: ${row.count} logs`);
    });
    
    // Check recent logs
    const [recent] = await connection.query(`
      SELECT id, admin_id, user_id, user_role, activity_type, activity_description, created_at
      FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n🕐 Recent 10 logs:');
    recent.forEach(log => {
      console.log(`  [${log.id}] ${log.activity_type} - ${log.activity_description} (Admin: ${log.admin_id}, User: ${log.user_id})`);
    });
    
    // Insert fresh sample data if no logs exist
    if (allLogs[0].total === 0) {
      console.log('\n⚠️  No logs found! Inserting sample data...\n');
      
      await connection.query(`
        INSERT INTO activity_logs 
          (admin_id, user_id, user_role, activity_type, activity_description, metadata, ip_address, user_agent, created_at) 
        VALUES 
          (8, 1, 'user', 'TICKET_CREATED', 'User created ticket G-001 for General service', '{"ticketNumber":"G-001","service":"General"}', '127.0.0.1', 'Mozilla/5.0', NOW()),
          (8, 1, 'user', 'TICKET_CALLED', 'User called ticket G-001 at Counter 1', '{"ticketNumber":"G-001","counter":1}', '127.0.0.1', 'Mozilla/5.0', NOW()),
          (8, 8, 'admin', 'SERVICE_CREATED', 'Admin created new service: VIP Service', '{"serviceName":"VIP Service","prefix":"V"}', '127.0.0.1', 'Mozilla/5.0', NOW()),
          (8, 8, 'admin', 'SERVICE_UPDATED', 'Admin updated service: General', '{"serviceName":"General","prefix":"G"}', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
          (8, 1, 'user', 'LOGIN', 'User logged in successfully', '{"device":"Chrome on Windows"}', '192.168.1.100', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
          (8, 2, 'receptionist', 'TICKET_CREATED', 'Receptionist created ticket G-002 for customer John Doe', '{"ticketNumber":"G-002","customerName":"John Doe"}', '192.168.1.101', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 1 HOUR))
      `);
      
      console.log('✅ Inserted 6 sample logs!');
      
      // Re-check
      const [newTotal] = await connection.query('SELECT COUNT(*) as total FROM activity_logs WHERE admin_id = 8');
      console.log(`✅ Total logs for admin_id=8: ${newTotal[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n✅ Done!\n');
  }
}

quickTestLogs();
