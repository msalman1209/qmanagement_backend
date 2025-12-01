import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSessionTables() {
  try {
    console.log('🔧 Setting up session tables...\n');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'database', 'create-admin-sessions-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing SQL...');
        await pool.query(statement);
        console.log('✅ Success\n');
      }
    }

    console.log('✅ Session tables setup complete!\n');

    // Verify tables exist
    const [adminSessions] = await pool.query("SHOW TABLES LIKE 'admin_sessions'");
    const [userSessions] = await pool.query("SHOW TABLES LIKE 'user_sessions'");

    console.log('📊 Table verification:');
    console.log(`   admin_sessions: ${adminSessions.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   user_sessions: ${userSessions.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupSessionTables();
