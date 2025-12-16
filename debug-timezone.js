import { convertUTCToTimezone, getAdminTimezone } from './utils/timezoneHelper.js';
import pool from './config/database.js';

const testTimezone = async () => {
  try {
    // Test the conversion function directly
    console.log('\n=== Testing convertUTCToTimezone function ===');
    
    const testUTC = new Date('2025-12-16T08:32:48Z'); // This is what the user saw
    console.log('Input UTC time:', testUTC.toISOString());
    
    // If admin timezone is +04:00 (GST), should be 12:32:48
    const gstResult = convertUTCToTimezone(testUTC, '+04:00');
    console.log('Result with +04:00 (GST):', gstResult);
    console.log('Expected: 2025-12-16 12:32:48');
    
    // If admin timezone is +05:00 (PKT), should be 13:32:48
    const pktResult = convertUTCToTimezone(testUTC, '+05:00');
    console.log('Result with +05:00 (PKT):', pktResult);
    console.log('Expected: 2025-12-16 13:32:48');
    
    // Check actual admin timezone from database
    console.log('\n=== Checking admin timezone from database ===');
    const conn = await pool.getConnection();
    const [admins] = await conn.query('SELECT id, timezone FROM admin LIMIT 5');
    console.log('Admins with timezones:');
    admins.forEach(admin => {
      console.log(`  Admin ID ${admin.id}: ${admin.timezone || 'NULL (default PKT)'}`);
    });
    
    // Check what getAdminTimezone returns for admin 8
    const adminId = 8; // From the user's screenshot
    const adminTz = await getAdminTimezone(adminId);
    console.log(`\ngetAdminTimezone(${adminId}) returned: ${adminTz}`);
    
    // Now test conversion with that timezone
    const convertedTime = convertUTCToTimezone(testUTC, adminTz);
    console.log(`convertUTCToTimezone with admin's timezone (${adminTz}): ${convertedTime}`);
    
    conn.release();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
  process.exit(0);
};

testTimezone();
