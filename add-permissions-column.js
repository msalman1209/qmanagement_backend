import pool from "./config/database.js";

async function addPermissionsColumn() {
  const connection = await pool.getConnection();
  try {
    console.log('🔧 Adding permissions column to users table...');
    
    // Add permissions column as JSON
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN permissions JSON NULL
    `);
    
    console.log('✅ Permissions column added successfully!');
    
    // Set default permissions for existing users based on their role
    console.log('🔧 Setting default permissions for existing users...');
    
    // Default permissions for users
    const userPermissions = {
      canCreateTickets: true,
      canViewReports: false,
      canManageQueue: false,
      canCallTickets: false,
      canAccessDashboard: false,
      canManageUsers: false,
      canManageTickets: false,
      canManageSettings: false,
      canManageCounters: false,
      canManageServices: false
    };
    
    // Default permissions for receptionists
    const receptionistPermissions = {
      canCreateTickets: true,
      canViewReports: false,
      canManageQueue: false,
      canCallTickets: false,
      canAccessDashboard: false,
      canManageUsers: false,
      canManageTickets: false,
      canManageSettings: false,
      canManageCounters: false,
      canManageServices: false
    };
    
    // Update users
    await connection.query(
      `UPDATE users SET permissions = ? WHERE role = 'user'`,
      [JSON.stringify(userPermissions)]
    );
    
    // Update receptionists
    await connection.query(
      `UPDATE users SET permissions = ? WHERE role = 'receptionist'`,
      [JSON.stringify(receptionistPermissions)]
    );
    
    console.log('✅ Default permissions set for existing users!');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Permissions column already exists!');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

addPermissionsColumn();
