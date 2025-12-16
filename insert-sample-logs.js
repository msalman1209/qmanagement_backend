import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const insertSampleLogs = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🗑️ Deleting existing logs for admin_id=8...');
    await connection.query('DELETE FROM activity_logs WHERE admin_id = 8');
    
    console.log('📝 Inserting 3 sample activity logs...');
    const [result] = await connection.query(`
      INSERT INTO activity_logs 
        (admin_id, user_id, user_role, activity_type, activity_description, metadata, ip_address, user_agent, created_at) 
      VALUES 
        (8, 1, 'user', 'TICKET_CREATED', 'User created a ticket for General service', '{"ticketNumber":"G-001","service":"General"}', '127.0.0.1', 'Mozilla/5.0', NOW()),
        (8, 1, 'user', 'TICKET_CALLED', 'User called ticket G-001 at Counter 1', '{"ticketNumber":"G-001","counter":1}', '127.0.0.1', 'Mozilla/5.0', NOW()),
        (8, 8, 'admin', 'SERVICE_CREATED', 'Admin created new service: VIP Service', '{"serviceName":"VIP Service","prefix":"V"}', '127.0.0.1', 'Mozilla/5.0', NOW())
    `);
    
    console.log(`✅ Inserted ${result.affectedRows} sample logs for admin_id=8`);
    
    const [check] = await connection.query('SELECT COUNT(*) as total FROM activity_logs WHERE admin_id = 8');
    console.log(`✅ Total logs in database: ${check[0].total}`);
    
    const [logs] = await connection.query('SELECT id, activity_type, activity_description FROM activity_logs WHERE admin_id = 8');
    console.log('\n📋 Sample logs:');
    logs.forEach(log => {
      console.log(`  - [${log.id}] ${log.activity_type}: ${log.activity_description}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
};

insertSampleLogs();
