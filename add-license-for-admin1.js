import pool from "./config/database.js";

async function addLicenseForAdmin1() {
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Checking license for admin ID 1...');
    
    // Check if license exists
    const [existing] = await connection.query(
      'SELECT * FROM licenses WHERE admin_id = 1'
    );
    
    if (existing.length > 0) {
      console.log('✅ License already exists for admin 1:', existing[0]);
      return;
    }
    
    console.log('⚠️  No license found for admin 1. Creating one...');
    
    // Create license for admin 1
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity
    
    await connection.query(`
      INSERT INTO licenses 
      (admin_id, license_key, max_users, max_receptionists, max_ticket_info_users, status, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      1, // admin_id
      'ADMIN1-LICENSE-' + Date.now(), // unique license key
      50, // max_users
      20, // max_receptionists
      10, // max_ticket_info_users
      'active', // status
      expiryDate // expires_at
    ]);
    
    console.log('✅ License created successfully for admin 1!');
    console.log('   Max Users: 50');
    console.log('   Max Receptionists: 20');
    console.log('   Max Ticket Info: 10');
    console.log('   Expires:', expiryDate.toISOString().split('T')[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

addLicenseForAdmin1();
