import pool from "./config/database.js";

async function checkAndFixLicense() {
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Checking licenses for admin_id 1...');
    
    // Check existing licenses
    const [licenses] = await connection.query(
      "SELECT * FROM licenses WHERE admin_id = 1"
    );
    
    console.log('📋 Found licenses:', licenses);
    
    if (licenses.length === 0) {
      console.log('❌ No license found for admin_id 1. Creating one...');
      
      // Create a license
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
      
      await connection.query(
        `INSERT INTO licenses (admin_id, max_users, max_receptionists, max_ticket_info_users, expiry_date, status) 
         VALUES (?, 50, 20, 10, ?, 'active')`,
        [1, expiryDate]
      );
      
      console.log('✅ License created successfully!');
      
      // Verify
      const [newLicense] = await connection.query(
        "SELECT * FROM licenses WHERE admin_id = 1"
      );
      console.log('📋 New license:', newLicense);
      
    } else {
      console.log('📊 Current license status:');
      licenses.forEach(lic => {
        console.log(`  - License ID: ${lic.id}`);
        console.log(`  - Status: ${lic.status}`);
        console.log(`  - Expiry: ${lic.expiry_date}`);
        console.log(`  - Max Users: ${lic.max_users}`);
        console.log(`  - Max Receptionists: ${lic.max_receptionists}`);
        
        if (lic.status !== 'active') {
          console.log('⚠️  License is NOT active!');
        }
        
        if (new Date(lic.expiry_date) < new Date()) {
          console.log('⚠️  License has EXPIRED!');
        }
      });
      
      // Update to active if not
      if (licenses[0].status !== 'active') {
        console.log('🔧 Updating license status to active...');
        await connection.query(
          "UPDATE licenses SET status = 'active' WHERE admin_id = 1"
        );
        console.log('✅ License activated!');
      }
      
      // Extend expiry if expired
      if (new Date(licenses[0].expiry_date) < new Date()) {
        console.log('🔧 Extending license expiry...');
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        await connection.query(
          "UPDATE licenses SET expiry_date = ? WHERE admin_id = 1",
          [newExpiry]
        );
        console.log('✅ License expiry extended!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

checkAndFixLicense();
