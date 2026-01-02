import pool from "../config/database.js";

async function checkLicenseColumns() {
  try {
    const [columns] = await pool.query('DESCRIBE licenses');
    
    console.log('📋 License Table Columns:\n');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Default: col.Default
    })));
    
    // Check for session-related fields
    const sessionFields = [
      'max_receptionist_sessions',
      'max_ticket_info_sessions', 
      'max_sessions_per_receptionist',
      'max_sessions_per_ticket_info',
      'both_user_receptionist_sessions',
      'both_user_ticket_info_sessions'
    ];
    
    console.log('\n🔍 Session Fields Status:');
    sessionFields.forEach(field => {
      const exists = columns.find(col => col.Field === field);
      console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLicenseColumns();
