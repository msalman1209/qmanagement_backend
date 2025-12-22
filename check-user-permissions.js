import pool from './config/database.js';

async function checkUserPermissions() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔍 Checking User Permissions in Database...\n');
    
    // Get recent users with their permissions
    const [users] = await connection.query(`
      SELECT 
        id,
        username,
        email,
        role,
        permissions,
        status,
        admin_id
      FROM users 
      WHERE role = 'user'
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach(user => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 User ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Admin ID: ${user.admin_id}`);
      console.log(`   Permissions (RAW):`, user.permissions);
      console.log(`   Permissions Type:`, typeof user.permissions);
      
      // Try to parse permissions
      if (user.permissions) {
        let parsed = user.permissions;
        if (typeof user.permissions === 'string') {
          try {
            parsed = JSON.parse(user.permissions);
            console.log(`   ✅ Parsed Permissions:`, parsed);
          } catch (e) {
            console.log(`   ❌ Failed to parse permissions:`, e.message);
          }
        } else if (typeof user.permissions === 'object') {
          console.log(`   ✅ Permissions (Object):`, parsed);
        }
        
        // Check specific permissions
        if (parsed && typeof parsed === 'object') {
          console.log(`   📋 Permission Details:`);
          console.log(`      - canCallTickets: ${parsed.canCallTickets}`);
          console.log(`      - canCreateTickets: ${parsed.canCreateTickets}`);
        }
      } else {
        console.log(`   ⚠️  NO PERMISSIONS SET!`);
      }
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check the permissions column structure
    const [columns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'permissions'
    `);
    
    if (columns.length > 0) {
      console.log('📊 Permissions Column Structure:');
      console.log(columns[0]);
    } else {
      console.log('❌ Permissions column does not exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkUserPermissions();
