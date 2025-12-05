-- Create counter_display_config table
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
);

-- Create slider_images table
CREATE TABLE IF NOT EXISTS slider_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image_url VARCHAR(255) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_selected TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config if not exists
INSERT IGNORE INTO counter_display_config (id, ticker_content) 
VALUES (1, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C');
