import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getTickets,
  createService,
  getServices,
  updateService,
  deleteService,
  assignServiceToUser,
  getUserServices,
  removeServiceFromUser,
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getConfiguration,
  updateConfiguration,
  getCounterDisplay,
  updateCounterDisplay,
  getReports,
  getUserSessions,
  updateProfile,
} from "../controllers/admin/index.js"

const router = express.Router()

// Profile Route (for logged-in admin/super_admin to update their own profile)
router.put("/profile", authenticateToken, authorize("admin", "super_admin"), updateProfile)

// User Management Routes
router.post("/users", authenticateToken, authorize("admin", "super_admin"), createUser)
router.get("/users", authenticateToken, authorize("admin", "super_admin"), getAllUsers)
router.put("/users/:userId", authenticateToken, authorize("admin", "super_admin"), updateUser)
router.delete("/users/:userId", authenticateToken, authorize("admin", "super_admin"), deleteUser)

// Tickets Routes
router.get("/tickets", authenticateToken, authorize("admin", "super_admin"), getTickets)

// Service Management Routes
router.post("/services", authenticateToken, authorize("admin", "super_admin"), createService)
router.get("/services", authenticateToken, authorize("admin", "super_admin"), getServices)
router.put("/services/:serviceId", authenticateToken, authorize("admin", "super_admin"), updateService)
router.delete("/services/:serviceId", authenticateToken, authorize("admin", "super_admin"), deleteService)

// Service Assignment Routes
router.post("/services/assign", authenticateToken, authorize("admin", "super_admin"), assignServiceToUser)
router.get("/services/user/:userId", authenticateToken, authorize("admin", "super_admin"), getUserServices)
router.post("/services/remove", authenticateToken, authorize("admin", "super_admin"), removeServiceFromUser)

// Admin Management Routes (Super Admin only)
router.get("/admins", authenticateToken, authorize("super_admin"), getAllAdmins)
router.get("/admins/:adminId", authenticateToken, authorize("super_admin"), getAdminById)
router.post("/admins", authenticateToken, authorize("super_admin"), createAdmin)
router.put("/admins/:adminId", authenticateToken, authorize("super_admin"), updateAdmin)
router.delete("/admins/:adminId", authenticateToken, authorize("super_admin"), deleteAdmin)

// Configuration Routes
router.get("/configuration", authenticateToken, authorize("admin", "super_admin"), getConfiguration)
router.put("/configuration", authenticateToken, authorize("admin", "super_admin"), updateConfiguration)

// Counter Display Routes
router.get("/counter-display", authenticateToken, authorize("admin", "super_admin"), getCounterDisplay)
router.put("/counter-display", authenticateToken, authorize("admin", "super_admin"), updateCounterDisplay)

// Reports Routes
router.get("/reports", authenticateToken, authorize("admin", "super_admin"), getReports)

// User Sessions Routes
router.get("/user-sessions", authenticateToken, authorize("admin", "super_admin"), getUserSessions)

export default router
