import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkActivityLogsStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n🔍 Checking activity_logs table structure...\n');
    
    // Get table structure
    const [structure] = await connection.query('DESCRIBE activity_logs');
    console.log('📋 Table Structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Check metadata column type
    const metadataCol = structure.find(col => col.Field === 'metadata');
    console.log('\n📊 Metadata Column Type:', metadataCol?.Type);
    
    // Get sample log with metadata
    const [samples] = await connection.query(`
      SELECT id, activity_type, metadata, typeof(metadata) as metadata_type
      FROM activity_logs 
      WHERE metadata IS NOT NULL
      LIMIT 3
    `);
    
    console.log('\n🧪 Sample Logs with Metadata:');
    samples.forEach((log, i) => {
      console.log(`\n  ${i + 1}. [ID: ${log.id}] ${log.activity_type}`);
      console.log(`     Metadata raw:`, log.metadata);
      console.log(`     Metadata type:`, typeof log.metadata);
      if (typeof log.metadata === 'string') {
        try {
          const parsed = JSON.parse(log.metadata);
          console.log(`     Parsed successfully:`, parsed);
        } catch (err) {
          console.log(`     ❌ Parse error:`, err.message);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkActivityLogsStructure();
