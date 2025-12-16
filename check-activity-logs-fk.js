import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkForeignKeys() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'activity_logs'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    
    console.log('\n📋 Foreign keys on activity_logs table:\n');
    if (fks.length === 0) {
      console.log('  ❌ No foreign keys found!');
    } else {
      fks.forEach(fk => {
        console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }
    
  } finally {
    await connection.end();
  }
}

checkForeignKeys();
