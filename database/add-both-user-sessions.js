import pool from "../config/database.js";

async function addBothUserSessionFields() {
  try {
    console.log('🔧 Adding both_user session fields to licenses table...\n');
    
    // Check if fields already exist
    const [existingColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'licenses' 
        AND COLUMN_NAME IN ('both_user_receptionist_sessions', 'both_user_ticket_info_sessions')
    `);
    
    const existingFields = existingColumns.map(col => col.COLUMN_NAME);
    
    // Add both_user_receptionist_sessions field if not exists
    if (!existingFields.includes('both_user_receptionist_sessions')) {
      await pool.query(`
        ALTER TABLE licenses 
        ADD COLUMN both_user_receptionist_sessions INT DEFAULT 1 
        COMMENT 'Max concurrent sessions for both_user on receptionist screen'
      `);
      console.log('✅ Added: both_user_receptionist_sessions');
    } else {
      console.log('⏭️  Skipped: both_user_receptionist_sessions (already exists)');
    }
    
    // Add both_user_ticket_info_sessions field if not exists
    if (!existingFields.includes('both_user_ticket_info_sessions')) {
      await pool.query(`
        ALTER TABLE licenses 
        ADD COLUMN both_user_ticket_info_sessions INT DEFAULT 1 
        COMMENT 'Max concurrent sessions for both_user on ticket_info screen'
      `);
      console.log('✅ Added: both_user_ticket_info_sessions');
    } else {
      console.log('⏭️  Skipped: both_user_ticket_info_sessions (already exists)');
    }
    
    // Verify the changes
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'licenses' 
        AND COLUMN_NAME LIKE '%both_user%'
    `);
    
    console.log('\n📋 Both User Fields in Licenses Table:');
    console.table(columns);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Now both_user can have separate session limits for:');
    console.log('   • Receptionist screen: both_user_receptionist_sessions');
    console.log('   • Ticket Info screen: both_user_ticket_info_sessions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

addBothUserSessionFields();
