import pool from '../config/database.js';

async function createTables() {
  try {
    // Create counter_display_config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counter_display_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        left_logo_url VARCHAR(255),
        right_logo_url VARCHAR(255),
        screen_type VARCHAR(50) DEFAULT 'horizontal',
        content_type VARCHAR(50) DEFAULT 'video',
        video_url VARCHAR(255),
        slider_timer INT DEFAULT 5,
        ticker_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ counter_display_config table created successfully');

    // Create slider_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS slider_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        image_url VARCHAR(255) NOT NULL,
        image_name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_selected TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ slider_images table created successfully');

    // Insert default config if not exists
    await pool.query(`
      INSERT IGNORE INTO counter_display_config (id, ticker_content) 
      VALUES (1, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C')
    `);
    console.log('✅ Default counter display config inserted');

    console.log('✅ Database setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

createTables();
