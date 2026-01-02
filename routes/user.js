import express from "express"
import { authenticateToken, authorize, checkPermission } from "../middlewares/auth.js"
import {
  getUserDashboard,
  getPendingTickets,
  getCompletedTickets,
  getUserProfile,
  updateUserProfile,
  getUserSessions,  
  getAllUsers,
  getAdminUsers,
  createTicketInfoUser,
  getTicketInfoUsers,
  updateUser,
  deleteUser
} from "../controllers/user/index.js"
import { getUserAssignedTickets } from "../controllers/user/getUserAssignedTickets.js"
import { callTicket } from "../controllers/user/callTicket.js"
import { getCalledTickets } from "../controllers/user/getCalledTickets.js"
import { getCalledTicketsToday } from "../controllers/user/getCalledTicketsToday.js"
import { getAvailableCounters } from "../controllers/user/getAvailableCounters.js"
import { getUserCounter } from "../controllers/user/getUserCounter.js"

const router = express.Router()

// Get available counters for user (for counter selection)
router.get("/available-counters", authenticateToken, getAvailableCounters)

// Get user's active session counter
router.get("/session/counter", authenticateToken, getUserCounter)

// Get all users (for admin)
router.get("/all", authenticateToken, getAllUsers)

// Get users for specific admin
router.get("/admin/:adminId", authenticateToken, getAdminUsers)

// Ticket Info User Management
router.post("/create-ticket-info", authenticateToken, authorize("admin"), createTicketInfoUser)
router.get("/ticket-info-users", authenticateToken, authorize("admin"), getTicketInfoUsers)
router.put("/:id", authenticateToken, authorize("admin"), updateUser)
router.delete("/:id", authenticateToken, authorize("admin"), deleteUser)

// Get user dashboard data - requires canCallTickets permission
router.get("/dashboard", authenticateToken, checkPermission('canCallTickets'), getUserDashboard)

// Get user's assigned service tickets
router.get("/tickets/assigned", authenticateToken, getUserAssignedTickets)

// Call a ticket - requires canCallTickets permission
router.post("/call-ticket", authenticateToken, checkPermission('canCallTickets'), callTicket)

// Get called tickets (today only)
router.get("/called-tickets/today", authenticateToken, getCalledTicketsToday)

// Get called tickets (all)
router.get("/called-tickets", authenticateToken, getCalledTickets)

// Get pending tickets
router.get("/tickets/pending", authenticateToken, getPendingTickets)

// Get completed tickets - requires canCreateTickets permission
router.get("/tickets/completed", authenticateToken, checkPermission('canCreateTickets'), getCompletedTickets)

// Get user profile
router.get("/profile", authenticateToken, getUserProfile)

// Update user profile
router.put("/profile", authenticateToken, updateUserProfile)

// Get user sessions
router.get("/sessions", authenticateToken, getUserSessions)

export default router
