import pool from "./config/database.js";
import bcryptjs from "bcryptjs";

async function checkAndFixAdmin() {
  try {
    console.log("\n🔍 Checking admin table...\n");

    // Get all admins
    const [admins] = await pool.query("SELECT id, username, email, role FROM admin");
    
    console.log("Current admins in database:");
    console.table(admins);

    // Check if super admin exists
    const [superAdmins] = await pool.query("SELECT * FROM admin WHERE role = 'super_admin'");
    
    if (superAdmins.length === 0) {
      console.log("\n❌ No super admin found. Creating one...\n");
      
      const hashedPassword = await bcryptjs.hash("superadmin@123", 10);
      
      await pool.query(
        "INSERT INTO admin (username, email, password, role) VALUES (?, ?, ?, 'super_admin')",
        ["superadmin", "superadmin@example.com", hashedPassword]
      );
      
      console.log("✅ Super admin created successfully!");
      console.log("   Email: superadmin@example.com");
      console.log("   Password: superadmin@123");
    } else {
      console.log("\n✅ Super admin exists:");
      console.log("   Email:", superAdmins[0].email);
      console.log("   Username:", superAdmins[0].username);
      
      // Test password
      const testPassword = await bcryptjs.compare("superadmin@123", superAdmins[0].password);
      console.log("   Password 'superadmin@123' valid:", testPassword);
      
      if (!testPassword) {
        console.log("\n⚠️  Password doesn't match. Updating password...");
        const newHash = await bcryptjs.hash("superadmin@123", 10);
        await pool.query(
          "UPDATE admin SET password = ? WHERE id = ?",
          [newHash, superAdmins[0].id]
        );
        console.log("✅ Password updated successfully!");
      }
    }

    console.log("\n✅ All done!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAndFixAdmin();
