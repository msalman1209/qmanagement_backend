import pool from '../config/database.js';

/**
 * Adds missing columns to existing tables based on Hostinger backup
 */
async function syncMissingColumns() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔄 Syncing missing columns from Hostinger backup...\n');
    
    const updates = [
      // Admin table updates
      {
        table: 'admin',
        columns: [
          "ADD COLUMN `total_counters` int(11) DEFAULT 5 AFTER `status`",
          "ADD COLUMN `license_start_date` date DEFAULT NULL AFTER `total_counters`",
          "ADD COLUMN `license_end_date` date DEFAULT NULL AFTER `license_start_date`",
          "ADD COLUMN `max_users` int(11) DEFAULT 10 AFTER `license_end_date`",
          "ADD COLUMN `max_counters` int(11) DEFAULT 10 AFTER `max_users`"
        ]
      },
      // Admin sessions table updates
      {
        table: 'admin_sessions',
        columns: [
          "ADD COLUMN `username` varchar(255) NOT NULL DEFAULT '' AFTER `admin_id`",
          "ADD COLUMN `role` varchar(50) NOT NULL DEFAULT 'admin' AFTER `username`",
          "ADD COLUMN `login_time` timestamp NULL DEFAULT current_timestamp() AFTER `ip_address`",
          "ADD COLUMN `active` tinyint(1) DEFAULT 1 AFTER `login_time`",
          "ADD COLUMN `expires_at` timestamp NULL DEFAULT NULL AFTER `last_activity`"
        ]
      },
      // Licenses table updates
      {
        table: 'licenses',
        columns: [
          "ADD COLUMN `company_logo` varchar(255) DEFAULT NULL AFTER `company_name`",
          "ADD COLUMN `max_receptionists` int(11) DEFAULT 5 AFTER `max_services`",
          "ADD COLUMN `max_ticket_info_users` int(11) DEFAULT 3 AFTER `max_receptionists`",
          "ADD COLUMN `max_sessions` int(11) DEFAULT 5 AFTER `max_ticket_info_users`"
        ]
      },
      // Services table updates
      {
        table: 'services',
        columns: [
          "ADD COLUMN `admin_id` int(11) DEFAULT NULL AFTER `id`",
          "ADD COLUMN `is_active` tinyint(1) DEFAULT 1 AFTER `show_sub_service_popup`"
        ]
      },
      // Tickets table updates
      {
        table: 'tickets',
        columns: [
          "ADD COLUMN `user_id` int(11) DEFAULT NULL AFTER `representative_id`",
          "ADD COLUMN `admin_id` int(11) DEFAULT NULL AFTER `user_id`"
        ]
      },
      // User sessions table updates
      {
        table: 'user_sessions',
        columns: [
          "ADD COLUMN `username` varchar(255) DEFAULT NULL AFTER `user_id`",
          "ADD COLUMN `role` varchar(50) DEFAULT NULL AFTER `username`",
          "ADD COLUMN `token` varchar(500) DEFAULT NULL AFTER `role`",
          "ADD COLUMN `email` varchar(255) DEFAULT NULL AFTER `token`",
          "ADD COLUMN `login_time` timestamp NULL DEFAULT current_timestamp() AFTER `email`"
        ]
      },
      // Voice settings table updates
      {
        table: 'voice_settings',
        columns: [
          "ADD COLUMN `second_language` varchar(10) DEFAULT NULL AFTER `language`",
          "ADD COLUMN `dubai_arabic` tinyint(1) DEFAULT 0 AFTER `second_language`",
          "ADD COLUMN `custom_text_lang1` text DEFAULT NULL AFTER `dubai_arabic`",
          "ADD COLUMN `custom_text_lang2` text DEFAULT NULL AFTER `custom_text_lang1`"
        ]
      }
    ];
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const update of updates) {
      console.log(`📋 Updating table: ${update.table}`);
      
      for (const columnSQL of update.columns) {
        try {
          // Try to add the column
          const alterSQL = `ALTER TABLE \`${update.table}\` ${columnSQL}`;
          await connection.query(alterSQL);
          
          // Get column name from SQL
          const columnName = columnSQL.match(/ADD COLUMN `(\w+)`/)?.[1] || 'column';
          console.log(`  ✅ Added column: ${columnName}`);
          successCount++;
        } catch (error) {
          // Column might already exist or other issue
          if (error.code === 'ER_DUP_FIELDNAME') {
            const columnName = columnSQL.match(/ADD COLUMN `(\w+)`/)?.[1] || 'column';
            console.log(`  ⏭️  Column already exists: ${columnName}`);
            skipCount++;
          } else {
            console.log(`  ⚠️  ${error.message.substring(0, 80)}`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully added: ${successCount} columns`);
    console.log(`⏭️  Already existed: ${skipCount} columns`);
    console.log('='.repeat(60) + '\n');
    
    // Verify all critical tables and their columns
    console.log('🔍 Verifying updated tables...\n');
    
    for (const update of updates) {
      const [columns] = await connection.query(`DESCRIBE \`${update.table}\``);
      console.log(`✅ ${update.table.padEnd(25)} - ${columns.length} columns`);
    }
    
    console.log('\n✅ Column sync completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

syncMissingColumns();
