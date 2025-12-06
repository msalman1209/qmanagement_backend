import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import {
  getUserDashboard,
  getPendingTickets,
  getCompletedTickets,
  getUserProfile,
  updateUserProfile,
  getUserSessions,
  getAllUsers,
} from "../controllers/user/index.js"
import { getUserAssignedTickets } from "../controllers/user/getUserAssignedTickets.js"
import { callTicket } from "../controllers/user/callTicket.js"
import { getCalledTickets } from "../controllers/user/getCalledTickets.js"
import { getCalledTicketsToday } from "../controllers/user/getCalledTicketsToday.js"
import { getAvailableCounters } from "../controllers/user/getAvailableCounters.js"

const router = express.Router()

// Get available counters for user (for counter selection)
router.get("/available-counters", authenticateToken, getAvailableCounters)

// Get all users (for admin)
router.get("/all", authenticateToken, getAllUsers)

// Get user dashboard data
router.get("/dashboard", authenticateToken, authorize("user"), getUserDashboard)

// Get user's assigned service tickets
router.get("/tickets/assigned", authenticateToken, authorize("user"), getUserAssignedTickets)

// Call a ticket
router.post("/call-ticket", authenticateToken, authorize("user"), callTicket)

// Get called tickets (today only)
router.get("/called-tickets/today", authenticateToken, getCalledTicketsToday)

// Get called tickets (all)
router.get("/called-tickets", authenticateToken, getCalledTickets)

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
