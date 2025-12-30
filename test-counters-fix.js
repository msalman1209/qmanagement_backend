import pool from './config/database.js';

(async () => {
  try {
    console.log('🔍 Checking admin and license data...\n');
    
    const [admins] = await pool.query('SELECT id, username FROM admin LIMIT 5');
    console.log('📋 Admins:');
    admins.forEach(admin => {
      console.log(`  - ID: ${admin.id}, Username: ${admin.username}`);
    });
    
    console.log('\n📋 Licenses:');
    const [licenses] = await pool.query('SELECT admin_id, max_counters, status FROM licenses');
    licenses.forEach(license => {
      console.log(`  - Admin ID: ${license.admin_id}, Max Counters: ${license.max_counters}, Status: ${license.status}`);
    });
    
    console.log('\n✅ Test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
