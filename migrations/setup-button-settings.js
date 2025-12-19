import pool from "../config/database.js";

async function setupButtonSettings() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔧 Setting up button settings in admin_btn_settings table...\n');

    // Insert default button settings
    await connection.query(`
      INSERT INTO admin_btn_settings (setting_name, setting_value) 
      VALUES ('show_next_button', 'true')
      ON DUPLICATE KEY UPDATE setting_value = setting_value
    `);

    await connection.query(`
      INSERT INTO admin_btn_settings (setting_name, setting_value) 
      VALUES ('show_transfer_button', 'true')
      ON DUPLICATE KEY UPDATE setting_value = setting_value
    `);

    console.log('✅ Button settings added successfully');

    // Verify settings
    const [settings] = await connection.query('SELECT * FROM admin_btn_settings WHERE setting_name IN (?, ?)', 
      ['show_next_button', 'show_transfer_button']);
    
    console.log('\n📊 Current button settings:');
    console.table(settings);
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up button settings:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run setup
setupButtonSettings()
  .then(() => {
    console.log('✨ Setup completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
