import express from "express"
import cors from "cors"
import "express-async-errors"
import dotenv from "dotenv"
import pool from "./config/database.js"
import bcryptjs from "bcryptjs"
import { initializeDatabase } from "./database/auto-setup.js"

// Function to setup database with automatic schema creation
async function setupDatabase() {
  try {
    // Automatically create all tables from COMPLETE_SCHEMA.sql
    console.log('🔧 Starting automatic database setup...\n');
    await initializeDatabase();

    // Ensure super admin exists
    console.log('\n👤 Checking super admin account...');
    const [superAdmins] = await pool.query("SELECT * FROM admin WHERE role = 'super_admin'");
    if (superAdmins.length === 0) {
      console.log("📝 Creating default super admin account...");
      const hashed = await bcryptjs.hash("superadmin@123", 10);
      await pool.query(
        "INSERT INTO admin (username, email, password, role, status) VALUES (?, ?, ?, 'super_admin', 'active')",
        ["superadmin", "superadmin@example.com", hashed]
      );
      console.log("✅ Super admin created successfully!");
      console.log("   📧 Email: superadmin@example.com");
      console.log("   🔑 Password: superadmin@123");
    } else {
      console.log("✅ Super admin account already exists.");
    }
    
    console.log('\n✨ Database setup completed successfully!\n');
  } catch (err) {
    console.error("❌ Error setting up database:", err.message);
    console.error("   Please check your database configuration in .env file\n");
  }
}

// Import routes
import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import userRoutes from "./routes/user.js"
import ticketRoutes from "./routes/tickets.js"
import licenseRoutes from "./routes/license.js"
import servicesRoutes from "./routes/services.js"
import voicesRoutes from "./routes/voices.js"
import counterDisplayRoutes from "./routes/counter-display.js"
import sessionsRoutes from "./routes/sessions.js"
import activityLogsRoutes from "./routes/activityLogs.js"
import timezoneRoutes from "./routes/timezoneRoutes.js"
import buttonSettingsRoutes from "./routes/buttonSettings.js"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://qmanagement-frontend.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
}

// Middleware
app.use(cors(corsOptions))
// Increase body size limits for large file uploads (videos)
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/user", userRoutes)
app.use("/api/users", userRoutes)
app.use("/api/tickets", ticketRoutes)
app.use("/api/license", licenseRoutes)
app.use("/api/services", servicesRoutes)
app.use("/api/voices", voicesRoutes)
app.use("/api/counter-display", counterDisplayRoutes)
app.use("/api/sessions", sessionsRoutes)
app.use("/api/activity-logs", activityLogsRoutes)
app.use("/api", timezoneRoutes)
app.use("/api/button-settings", buttonSettingsRoutes)

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
setupDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`)
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`)
  })
  
  // Increase timeout for large file uploads
  server.timeout = 600000; // 10 minutes
  server.keepAliveTimeout = 650000; // 10 minutes + 50 seconds
  server.headersTimeout = 660000; // 11 minutes
  
  console.log('⏱️  Server timeout set to 10 minutes for large file uploads\n')
})
