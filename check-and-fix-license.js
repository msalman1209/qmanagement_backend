import pool from './config/database.js';
import { generateLicenseKey, calculateExpiryDate } from './utils/licenseUtils.js';

async function checkAndFixLicenses() {
  try {
    console.log('🔍 Checking admin licenses...\n');

    // Get all admins with role 'admin' (not super_admin)
    const [admins] = await pool.query(
      "SELECT id, username, email, role FROM admin WHERE role = 'admin'"
    );

    console.log(`Found ${admins.length} admin(s)\n`);

    for (const admin of admins) {
      console.log(`\n📋 Checking admin: ${admin.username} (${admin.email})`);

      // Check if license exists
      const [licenses] = await pool.query(
        "SELECT * FROM licenses WHERE admin_id = ? ORDER BY expiry_date DESC LIMIT 1",
        [admin.id]
      );

      if (licenses.length === 0) {
        console.log(`   ❌ No license found`);
        console.log(`   ➕ Creating new Premium license...`);

        // Create new premium license (1 year validity)
        const licenseKey = generateLicenseKey();
        const startDate = new Date().toISOString().split('T')[0];
        const expiryDate = calculateExpiryDate(startDate, 'premium');

        await pool.query(
          `INSERT INTO licenses (
            license_key, admin_id, admin_name, company_name,
            email, license_type, max_users, max_counters,
            expiry_date, start_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            licenseKey,
            admin.id,
            admin.username,
            'Company',
            admin.email,
            'premium',
            50,
            20,
            expiryDate,
            startDate,
            'active'
          ]
        );

        console.log(`   ✅ License created successfully!`);
        console.log(`      License Key: ${licenseKey}`);
        console.log(`      Type: Premium`);
        console.log(`      Valid until: ${expiryDate}`);
        console.log(`      Max Users: 50`);
        console.log(`      Max Counters: 20`);
      } else {
        const license = licenses[0];
        const expiryDate = new Date(license.expiry_date);
        const today = new Date();
        const isExpired = expiryDate < today;

        console.log(`   ✅ License found!`);
        console.log(`      License Key: ${license.license_key}`);
        console.log(`      Type: ${license.license_type}`);
        console.log(`      Status: ${license.status}`);
        console.log(`      Valid until: ${license.expiry_date}`);
        console.log(`      Max Users: ${license.max_users}`);
        console.log(`      Max Counters: ${license.max_counters}`);
        
        if (isExpired) {
          console.log(`      ⚠️  Status: EXPIRED`);
        } else {
          const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          console.log(`      ✅ Status: ACTIVE (${daysRemaining} days remaining)`);
        }
      }
    }

    console.log('\n✅ License check complete!\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAndFixLicenses();
