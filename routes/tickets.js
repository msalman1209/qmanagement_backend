import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import {
  createTicket,
  updateTicketStatus,
  transferTicket,
  getAllTickets,
  getTicketById,
  callNextTicket,
  lockTicket,
  getReports,
} from "../controllers/tickets/index.js"
import { freshTicket } from "../controllers/user/freshTicket.js"

const router = express.Router()

// Create a new ticket
router.post("/", createTicket)

// Get reports
router.get("/reports", authenticateToken, authorize("admin", "super_admin"), getReports)

// Get all tickets
router.get("/", authenticateToken, authorize("admin", "user", "super_admin", "receptionist" , "receptionist,ticket_info"), getAllTickets)

// Get ticket by ID
router.get("/:ticketId", authenticateToken, authorize("admin", "user", "super_admin", "receptionist"), getTicketById)

// Update ticket status
router.put("/:ticketId", authenticateToken, authorize("admin", "user"), updateTicketStatus)

// Transfer ticket
router.post("/:ticketId/transfer", authenticateToken, authorize("user", "admin"), transferTicket)

// Fresh ticket - Only for Super Admin
router.post("/:ticketId/fresh", authenticateToken, authorize("super_admin"), freshTicket)

// Call next ticket
router.post("/call-next", authenticateToken, authorize("user"), callNextTicket)

// Lock/Unlock ticket
router.post("/:ticketId/lock", authenticateToken, authorize("user", "super_admin"), lockTicket)

export default router
