import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import { getAdminInfo, getAllAdmins } from "../controllers/license/index.js"

const router = express.Router()

// Get admin info (Super Admin only)
router.get("/admin/:adminId", authenticateToken, authorize("super_admin"), getAdminInfo)

// Get all admins (Super Admin only)
router.get("/admins", authenticateToken, authorize("super_admin"), getAllAdmins)

export default router
