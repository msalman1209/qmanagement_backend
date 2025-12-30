import pool from './config/database.js';

async function checkButtonSettingsTable() {
  try {
    console.log('🔍 Checking admin_btn_settings table structure...\n');

    // Check if table exists
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'admin_btn_settings'"
    );

    if (tables.length === 0) {
      console.log('❌ Table admin_btn_settings does not exist!');
      console.log('\n📝 Creating table with admin_id column...\n');
      
      await pool.query(`
        CREATE TABLE admin_btn_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_id INT NOT NULL,
          setting_name VARCHAR(100) NOT NULL,
          setting_value VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_admin_setting (admin_id, setting_name),
          FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ Table created successfully!');
    } else {
      console.log('✅ Table exists. Checking columns...\n');
      
      const [columns] = await pool.query(
        "DESCRIBE admin_btn_settings"
      );
      
      console.log('Current columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Key ? `[${col.Key}]` : ''}`);
      });
      
      // Check if admin_id column exists
      const hasAdminId = columns.some(col => col.Field === 'admin_id');
      
      if (!hasAdminId) {
        console.log('\n⚠️  admin_id column not found. Adding it...\n');
        
        // Step 1: Add admin_id column
        await pool.query(`
          ALTER TABLE admin_btn_settings 
          ADD COLUMN admin_id INT NOT NULL DEFAULT 1 AFTER id
        `);
        console.log('✅ admin_id column added');
        
        // Step 2: Add unique constraint
        await pool.query(`
          ALTER TABLE admin_btn_settings
          DROP INDEX IF EXISTS unique_admin_setting
        `);
        
        await pool.query(`
          ALTER TABLE admin_btn_settings
          ADD UNIQUE KEY unique_admin_setting (admin_id, setting_name)
        `);
        console.log('✅ Unique constraint added');
        
        console.log('\n✅ admin_id column setup complete!');
      } else {
        console.log('\n✅ admin_id column already exists!');
      }
    }
    
    // Show sample data
    console.log('\n📊 Current data in table:');
    const [data] = await pool.query(
      'SELECT * FROM admin_btn_settings LIMIT 10'
    );
    
    if (data.length === 0) {
      console.log('  (No data)');
    } else {
      console.table(data);
    }
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkButtonSettingsTable();
