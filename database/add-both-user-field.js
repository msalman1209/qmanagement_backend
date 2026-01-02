import pool from '../config/database.js';

async function addBothUserField() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Adding both_user field to licenses table...\n');

    // Check if column already exists
    const [existingColumns] = await connection.query(`
      SHOW COLUMNS FROM licenses WHERE Field = 'both_user'
    `);

    if (existingColumns.length === 0) {
      // Add both_user field (default 1)
      await connection.query(`
        ALTER TABLE licenses 
        ADD COLUMN both_user TINYINT(1) DEFAULT 1 
        COMMENT 'Number of default users with both receptionist and ticket_info access'
        AFTER max_sessions_per_ticket_info
      `);

      console.log('✅ Added both_user field to licenses table');
    } else {
      console.log('ℹ️  both_user field already exists');
    }

    // Also rename columns if they exist
    const [oldColumns] = await connection.query(`
      SHOW COLUMNS FROM licenses WHERE Field IN ('max_sessions_per_receptionist', 'max_sessions_per_ticket_info')
    `);

    if (oldColumns.length > 0) {
      console.log('\n🔄 Renaming session columns for clarity...');
      
      // Rename if old column names exist
      const columnNames = oldColumns.map(c => c.Field);
      
      if (columnNames.includes('max_sessions_per_receptionist')) {
        await connection.query(`
          ALTER TABLE licenses 
          CHANGE COLUMN max_sessions_per_receptionist max_receptionist_sessions INT(11) DEFAULT 1
          COMMENT 'Total receptionist sessions allowed'
        `);
        console.log('✅ Renamed max_sessions_per_receptionist → max_receptionist_sessions');
      }

      if (columnNames.includes('max_sessions_per_ticket_info')) {
        await connection.query(`
          ALTER TABLE licenses 
          CHANGE COLUMN max_sessions_per_ticket_info max_ticket_info_sessions INT(11) DEFAULT 1
          COMMENT 'Total ticket info sessions allowed'
        `);
        console.log('✅ Renamed max_sessions_per_ticket_info → max_ticket_info_sessions');
      }
    }

    // Update existing licenses to have both_user = 1
    const [result] = await connection.query(`
      UPDATE licenses 
      SET both_user = 1 
      WHERE both_user IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} existing licenses`);

    // Verify the change
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM licenses WHERE Field = 'both_user'
    `);

    if (columns.length > 0) {
      console.log('\n✅ Verification successful!');
      console.log('📋 Field details:', columns[0]);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ both_user field added (default: 1)');
    console.log('- ✅ All existing licenses updated');
    console.log('- ✅ One user will be created with both receptionist & ticket_info roles');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

addBothUserField().catch(console.error);
