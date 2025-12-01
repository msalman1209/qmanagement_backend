import pool from '../config/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Initializing database tables...');

    // Check if tables exist
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);

    // Create admin table if not exists
    if (!tableNames.includes('admin')) {
      console.log('Creating admin table...');
      await connection.query(`
        CREATE TABLE admin (
          id INT(11) NOT NULL AUTO_INCREMENT,
          username VARCHAR(30) DEFAULT NULL,
          email VARCHAR(100) DEFAULT NULL,
          password VARCHAR(255) DEFAULT NULL,
          role ENUM('super_admin', 'admin') DEFAULT 'admin',
          license_key VARCHAR(255) DEFAULT NULL,
          license_expiry_date DATE DEFAULT NULL,
          status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          total_counters INT(11) DEFAULT 5,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_username (username),
          UNIQUE KEY unique_email (email),
          KEY idx_license_key (license_key),
          KEY idx_role (role),
          KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Admin table created');
    } else {
      // Check if license_key column exists
      const [licenseKeyCol] = await connection.query("SHOW COLUMNS FROM admin LIKE 'license_key'");
      if (licenseKeyCol.length === 0) {
        console.log('Adding license_key column to admin table...');
        await connection.query("ALTER TABLE admin ADD COLUMN license_key VARCHAR(255) DEFAULT NULL AFTER role");
        console.log('✅ license_key column added');
      }

      // Check if license_expiry_date column exists
      const [expiryCol] = await connection.query("SHOW COLUMNS FROM admin LIKE 'license_expiry_date'");
      if (expiryCol.length === 0) {
        console.log('Adding license_expiry_date column to admin table...');
        await connection.query("ALTER TABLE admin ADD COLUMN license_expiry_date DATE DEFAULT NULL AFTER license_key");
        console.log('✅ license_expiry_date column added');
      }

      // Check if total_counters column exists
      const [countersCol] = await connection.query("SHOW COLUMNS FROM admin LIKE 'total_counters'");
      if (countersCol.length === 0) {
        console.log('Adding total_counters column to admin table...');
        await connection.query("ALTER TABLE admin ADD COLUMN total_counters INT(11) DEFAULT 5 AFTER status");
        console.log('✅ total_counters column added');
      }
    }

    // Create admin_sessions table if not exists
    if (!tableNames.includes('admin_sessions')) {
      console.log('Creating admin_sessions table...');
      await connection.query(`
        CREATE TABLE admin_sessions (
          session_id INT(11) NOT NULL AUTO_INCREMENT,
          admin_id INT(11) NOT NULL,
          username VARCHAR(50) DEFAULT NULL,
          role VARCHAR(50) DEFAULT NULL,
          token VARCHAR(500) NOT NULL,
          device_info VARCHAR(255) DEFAULT NULL,
          ip_address VARCHAR(50) DEFAULT NULL,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          active TINYINT(1) DEFAULT 1,
          PRIMARY KEY (session_id),
          KEY idx_admin_id (admin_id),
          KEY idx_token (token(255)),
          KEY idx_expires_at (expires_at),
          FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Admin_sessions table created');
    }

    // Create licenses table if not exists
    if (!tableNames.includes('licenses')) {
      console.log('Creating licenses table...');
      await connection.query(`
        CREATE TABLE licenses (
          id INT(11) NOT NULL AUTO_INCREMENT,
          license_key VARCHAR(255) NOT NULL,
          admin_id INT(11) NOT NULL,
          admin_name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          company_logo VARCHAR(255) DEFAULT NULL,
          phone VARCHAR(50) DEFAULT NULL,
          email VARCHAR(255) NOT NULL,
          address TEXT DEFAULT NULL,
          city VARCHAR(100) DEFAULT NULL,
          country VARCHAR(100) DEFAULT NULL,
          license_type ENUM('trial', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
          start_date DATE NOT NULL,
          expiry_date DATE NOT NULL,
          max_users INT(11) DEFAULT 10,
          max_counters INT(11) DEFAULT 5,
          max_services INT(11) DEFAULT 10,
          features JSON DEFAULT NULL,
          status ENUM('active', 'inactive', 'suspended', 'expired') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_license_key (license_key),
          KEY idx_admin_id (admin_id),
          KEY idx_expiry_date (expiry_date),
          KEY idx_status (status),
          KEY idx_license_type (license_type),
          FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Licenses table created');
    } else {
      // Check if company_logo column exists
      const [logoCol] = await connection.query("SHOW COLUMNS FROM licenses LIKE 'company_logo'");
      if (logoCol.length === 0) {
        console.log('Adding company_logo column to licenses table...');
        await connection.query("ALTER TABLE licenses ADD COLUMN company_logo VARCHAR(255) DEFAULT NULL AFTER company_name");
        console.log('✅ company_logo column added');
      }
    }

    // Create services table if not exists
    if (!tableNames.includes('services')) {
      console.log('Creating services table...');
      await connection.query(`
        CREATE TABLE services (
          id INT(11) NOT NULL AUTO_INCREMENT,
          service_name VARCHAR(255) NOT NULL,
          parent_id VARCHAR(250) DEFAULT NULL,
          initial_ticket VARCHAR(100) NOT NULL,
          color VARCHAR(7) NOT NULL,
          description TEXT DEFAULT NULL,
          assigned_user_id INT(11) DEFAULT NULL,
          assigned_counter_id INT(11) DEFAULT NULL,
          admin_id INT(11) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          service_name_arabic VARCHAR(255) DEFAULT NULL,
          logo_url VARCHAR(255) DEFAULT NULL,
          show_sub_service_popup TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_admin_id (admin_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Services table created');
    }

    // Create users table if not exists
    if (!tableNames.includes('users')) {
      console.log('Creating users table...');
      await connection.query(`
        CREATE TABLE users (
          id INT(11) NOT NULL AUTO_INCREMENT,
          username VARCHAR(255) DEFAULT NULL,
          email VARCHAR(100) NOT NULL,
          password VARCHAR(250) NOT NULL,
          role ENUM('user', 'receptionist', 'admin', 'super_admin') DEFAULT 'user',
          admin_id INT(11) DEFAULT NULL,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_email (email),
          KEY idx_admin_id (admin_id),
          KEY idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Users table created');
    } else {
      // Add role column if it doesn't exist
      const [userColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      `);
      const userColumnNames = userColumns.map(col => col.COLUMN_NAME);
      
      if (!userColumnNames.includes('role')) {
        console.log('Adding role column to users table...');
        await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('user', 'receptionist', 'admin', 'super_admin') DEFAULT 'user' AFTER password`);
        await connection.query(`ALTER TABLE users ADD INDEX idx_role (role)`);
        console.log('✅ role column added');
      } else {
        // Modify existing role column to add receptionist if needed
        try {
          await connection.query(`ALTER TABLE users MODIFY COLUMN role ENUM('user', 'receptionist', 'admin', 'super_admin') DEFAULT 'user'`);
          console.log('✅ role column updated with receptionist');
        } catch (e) {
          // Column already has correct values
        }
      }
    }

    // Create tickets table if not exists
    if (!tableNames.includes('tickets')) {
      console.log('Creating tickets table...');
      await connection.query(`
        CREATE TABLE tickets (
          id INT(11) NOT NULL AUTO_INCREMENT,
          ticket_id VARCHAR(255) DEFAULT NULL,
          counter_no VARCHAR(250) DEFAULT NULL,
          service_name VARCHAR(255) DEFAULT NULL,
          time TIME NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(200) DEFAULT NULL,
          status_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          name VARCHAR(30) NOT NULL DEFAULT '',
          email VARCHAR(30) NOT NULL DEFAULT '',
          number VARCHAR(30) NOT NULL DEFAULT '',
          representative VARCHAR(200) DEFAULT NULL,
          caller VARCHAR(200) DEFAULT NULL,
          calling_time INT(100) NOT NULL DEFAULT 0,
          calling_user_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reason TEXT NOT NULL DEFAULT '',
          service_time TIME NOT NULL DEFAULT '00:00:00',
          representative_id VARCHAR(200) DEFAULT NULL,
          transfered VARCHAR(100) DEFAULT NULL,
          transfered_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          solved_by_counter VARCHAR(200) DEFAULT NULL,
          transfer_by VARCHAR(200) DEFAULT NULL,
          locked_by INT(11) DEFAULT NULL,
          user_id INT(11) DEFAULT NULL,
          admin_id INT(11) DEFAULT NULL,
          last_updated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_user_id (user_id),
          KEY idx_admin_id (admin_id),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tickets table created');
    } else {
      // Add user_id and admin_id columns if they don't exist
      const [ticketColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tickets'
      `);
      const ticketColumnNames = ticketColumns.map(col => col.COLUMN_NAME);
      
      if (!ticketColumnNames.includes('user_id')) {
        console.log('Adding user_id column to tickets table...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN user_id INT(11) DEFAULT NULL AFTER locked_by`);
        await connection.query(`ALTER TABLE tickets ADD INDEX idx_user_id (user_id)`);
        console.log('✅ user_id column added');
      }
      
      if (!ticketColumnNames.includes('admin_id')) {
        console.log('Adding admin_id column to tickets table...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN admin_id INT(11) DEFAULT NULL AFTER user_id`);
        await connection.query(`ALTER TABLE tickets ADD INDEX idx_admin_id (admin_id)`);
        console.log('✅ admin_id column added');
      }
    }

    // Create Counters table if not exists
    if (!tableNames.includes('Counters')) {
      console.log('Creating Counters table...');
      await connection.query(`
        CREATE TABLE Counters (
          id INT(11) NOT NULL AUTO_INCREMENT,
          counter_name VARCHAR(255) DEFAULT NULL,
          current_ticket_id VARCHAR(200) NOT NULL DEFAULT '',
          status VARCHAR(200) NOT NULL DEFAULT '',
          counter_no VARCHAR(250) NOT NULL DEFAULT '',
          user_status VARCHAR(250) NOT NULL DEFAULT '',
          calling_time INT(100) NOT NULL DEFAULT 0,
          voice VARCHAR(250) NOT NULL DEFAULT '',
          language VARCHAR(250) NOT NULL DEFAULT '',
          news_ticker TEXT NOT NULL DEFAULT '',
          ad_vedio TEXT NOT NULL DEFAULT '',
          is_called TINYINT(1) DEFAULT 0,
          ticket_time INT(11) DEFAULT NULL,
          called_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Counters table created');
    }

    // Create other necessary tables
    const otherTables = [
      {
        name: 'user_services',
        query: `
          CREATE TABLE user_services (
            id INT(11) NOT NULL AUTO_INCREMENT,
            user_id INT(11) DEFAULT NULL,
            service_id INT(11) DEFAULT NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY service_id (service_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'ticket_counters',
        query: `
          CREATE TABLE ticket_counters (
            prefix VARCHAR(1) NOT NULL,
            last_ticket_number INT(11) DEFAULT NULL,
            last_reset_date DATE DEFAULT NULL,
            PRIMARY KEY (prefix)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'user_sessions',
        query: `
          CREATE TABLE user_sessions (
            session_id INT(11) NOT NULL AUTO_INCREMENT,
            user_id INT(11) NOT NULL,
            username VARCHAR(50) DEFAULT NULL,
            email VARCHAR(255) DEFAULT NULL,
            counter_no INT(11) DEFAULT NULL,
            admin_id INT(11) DEFAULT NULL,
            token VARCHAR(500) NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            device_info VARCHAR(255) DEFAULT NULL,
            ip_address VARCHAR(50) DEFAULT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_activity TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            active TINYINT(1) DEFAULT 1,
            is_active TINYINT(1) DEFAULT 0,
            PRIMARY KEY (session_id),
            KEY user_id (user_id),
            KEY idx_token (token(255)),
            KEY idx_expires_at (expires_at),
            KEY idx_counter_admin (counter_no, admin_id, is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'admin_btn_settings',
        query: `
          CREATE TABLE admin_btn_settings (
            id INT(11) NOT NULL AUTO_INCREMENT,
            setting_name VARCHAR(255) NOT NULL,
            setting_value VARCHAR(255) NOT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'all_counters',
        query: `
          CREATE TABLE all_counters (
            id INT(11) NOT NULL AUTO_INCREMENT,
            counter_no INT(30) NOT NULL,
            username VARCHAR(250) NOT NULL,
            ticket_id VARCHAR(250) NOT NULL,
            time TIME NOT NULL,
            date DATE NOT NULL,
            service_name VARCHAR(250) NOT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      }
    ];

    for (const table of otherTables) {
      if (!tableNames.includes(table.name)) {
        console.log(`Creating ${table.name} table...`);
        await connection.query(table.query);
        console.log(`✅ ${table.name} table created`);
      }
    }

    // Fix user_sessions table if it exists but missing columns
    if (tableNames.includes('user_sessions')) {
      console.log('Checking user_sessions table for missing columns...');
      
      // Add counter tracking columns
      try {
        await connection.query("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL AFTER username");
      } catch (e) {
        // Column might already exist
      }
      try {
        await connection.query("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS counter_no INT(11) DEFAULT NULL AFTER email");
      } catch (e) {
        // Column might already exist
      }
      try {
        await connection.query("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS admin_id INT(11) DEFAULT NULL AFTER counter_no");
      } catch (e) {
        // Column might already exist
      }
      try {
        await connection.query("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0 AFTER active");
      } catch (e) {
        // Column might already exist
      }
      
      const [activeCol] = await connection.query("SHOW COLUMNS FROM user_sessions LIKE 'active'");
      if (activeCol.length === 0) {
        console.log('Adding missing legacy columns to user_sessions table...');
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN username VARCHAR(50) DEFAULT NULL AFTER user_id");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN token VARCHAR(500) NOT NULL AFTER username");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN device_info VARCHAR(255) DEFAULT NULL AFTER device_id");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(50) DEFAULT NULL AFTER device_info");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ip_address");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER login_time");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMP NOT NULL AFTER created_at");
        } catch (e) {
          // Column might already exist
        }
        try {
          await connection.query("ALTER TABLE user_sessions ADD COLUMN active TINYINT(1) DEFAULT 1 AFTER expires_at");
        } catch (e) {
          // Column might already exist
        }
        console.log('✅ user_sessions columns updated');
      }
    }

    console.log('✅ Database initialization complete!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  } finally {
    connection.release();
  }
};

export default initializeDatabase;
