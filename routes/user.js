import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import {
  getUserDashboard,
  getPendingTickets,
  getCompletedTickets,
  getUserProfile,
  updateUserProfile,
  getUserSessions,
} from "../controllers/user/index.js"

const router = express.Router()

// Get user dashboard data
router.get("/dashboard", authenticateToken, authorize("user"), getUserDashboard)

// Get pending tickets
router.get("/tickets/pending", authenticateToken, authorize("user"), getPendingTickets)

// Get completed tickets
router.get("/tickets/completed", authenticateToken, authorize("user"), getCompletedTickets)

// Get user profile
router.get("/profile", authenticateToken, authorize("user"), getUserProfile)

// Update user profile
router.put("/profile", authenticateToken, authorize("user"), updateUserProfile)

// Get user sessions
router.get("/sessions", authenticateToken, authorize("user"), getUserSessions)

export default router
