import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixActivityLogsForeignKey() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n🔧 Fixing activity_logs foreign key constraint...\n');
    
    // Step 1: Drop existing foreign key
    console.log('1️⃣ Dropping existing foreign key constraint...');
    await connection.query(`
      ALTER TABLE activity_logs 
      DROP FOREIGN KEY activity_logs_ibfk_1
    `);
    console.log('✅ Existing foreign key dropped');
    
    // Step 2: Add correct foreign key pointing to admin table
    console.log('\n2️⃣ Adding correct foreign key (admin_id → admin.id)...');
    await connection.query(`
      ALTER TABLE activity_logs 
      ADD CONSTRAINT activity_logs_admin_fk 
      FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
    `);
    console.log('✅ Correct foreign key added');
    
    // Step 3: Verify
    console.log('\n3️⃣ Verifying foreign key...');
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      AND TABLE_NAME = 'activity_logs'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\n📋 Foreign keys on activity_logs table:');
    constraints.forEach(fk => {
      console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    
    console.log('\n✅ Foreign key fix completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await connection.end();
  }
}

fixActivityLogsForeignKey();
