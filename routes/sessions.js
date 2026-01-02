import express from "express";
import { authenticateToken, authorize } from "../middlewares/auth.js";
import {
  getTicketInfoSessions,
  getReceptionistSessions,
  deleteSession
} from "../controllers/sessions/displayScreensSessions.js";
import { validateSession } from "../controllers/sessions/validateSession.js";

const router = express.Router();

// Validate if current session is active
router.get("/validate", authenticateToken, validateSession);

// Get ticket_info sessions for admin
router.get("/ticket-info/:admin_id", authenticateToken, authorize("admin", "super_admin"), getTicketInfoSessions);

// Get receptionist sessions for admin
router.get("/receptionist/:admin_id", authenticateToken, authorize("admin", "super_admin"), getReceptionistSessions);

// Delete session by ID
router.delete("/:session_id", authenticateToken, authorize("admin", "super_admin"), deleteSession);

export default router;
