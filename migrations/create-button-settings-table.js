import pool from "../config/database.js";

async function createButtonSettingsTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔧 Creating admin_button_settings table...\n');

    // Create admin_button_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_button_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        show_next_button BOOLEAN DEFAULT TRUE,
        show_transfer_button BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE,
        UNIQUE KEY unique_admin_settings (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ admin_button_settings table created successfully');

    // Insert default settings for existing admins
    const [admins] = await connection.query('SELECT id FROM admin');
    
    for (const admin of admins) {
      await connection.query(`
        INSERT INTO admin_button_settings (admin_id, show_next_button, show_transfer_button) 
        VALUES (?, TRUE, TRUE)
        ON DUPLICATE KEY UPDATE admin_id = admin_id
      `, [admin.id]);
    }

    console.log(`✅ Default settings added for ${admins.length} admins\n`);

  } catch (error) {
    console.error('❌ Error creating button settings table:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration
createButtonSettingsTable()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
