import express from "express"
import cors from "cors"
import "express-async-errors"
import dotenv from "dotenv"
import pool from "./config/database.js"
import bcryptjs from "bcryptjs"
// Function to initialize DB schema if tables are missing
async function initializeDatabase() {
  try {
    // Check if admin table exists
    const [rows] = await pool.query("SHOW TABLES LIKE 'admin'");
    if (rows.length === 0) {
      console.log("Admin table not found. Database might not be initialized.");
      console.log("Please run the schema.sql file manually.");
      return;
    }
    
    console.log("Database tables found.");

    // Check if role column exists in admin table
    const [columns] = await pool.query("SHOW COLUMNS FROM admin LIKE 'role'");
    if (columns.length === 0) {
      console.log("Adding role column to admin table...");
      await pool.query("ALTER TABLE admin ADD COLUMN role ENUM('admin', 'super_admin') DEFAULT 'admin' AFTER password");
      console.log("Role column added successfully.");
    } else {
      console.log("Role column already exists in admin table.");
    }

    // Check if super admin exists
    const [superAdmins] = await pool.query("SELECT * FROM admin WHERE role = 'super_admin'");
    if (superAdmins.length === 0) {
      console.log("Creating default super admin account...");
      const hashed = await bcryptjs.hash("superadmin@123", 10);
      await pool.query(
        "INSERT INTO admin (username, email, password, role) VALUES (?, ?, ?, 'super_admin')",
        ["superadmin", "superadmin@example.com", hashed]
      );
      console.log("✅ Super admin created successfully!");
      console.log("   Email: superadmin@example.com");
      console.log("   Password: superadmin@123");
    } else {
      console.log("Super admin account already exists.");
    }
  } catch (err) {
    console.error("Error initializing database:", err.message);
  }
}

// Import routes
import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import userRoutes from "./routes/user.js"
import ticketRoutes from "./routes/tickets.js"
import licenseRoutes from "./routes/license.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/users", userRoutes)
app.use("/api/tickets", ticketRoutes)
app.use("/api/license", licenseRoutes)

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  })
})

const PORT = process.env.PORT || 5000

// Initialize DB then start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`)
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`)
  })
})
