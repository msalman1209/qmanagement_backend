import express from "express"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import { 
  getAdminInfo, 
  getAllAdmins,
  createLicense,
  getAllLicenses,
  getLicenseById,
  updateLicense,
  deleteLicense,
  getLicenseReport
} from "../controllers/license/index.js"

const router = express.Router()

// Get admin info (Super Admin only)
router.get("/admin/:adminId", authenticateToken, authorize("super_admin"), getAdminInfo)

// Get all admins (Super Admin only)
router.get("/admins", authenticateToken, authorize("super_admin"), getAllAdmins)

// License Management Routes (Super Admin only)
router.post("/create", authenticateToken, authorize("super_admin"), createLicense)
router.get("/all", authenticateToken, authorize("super_admin"), getAllLicenses)
router.get("/report", authenticateToken, authorize("super_admin"), getLicenseReport)
router.get("/:id", authenticateToken, authorize("super_admin"), getLicenseById)
router.put("/:id", authenticateToken, authorize("super_admin"), updateLicense)
router.delete("/:id", authenticateToken, authorize("super_admin"), deleteLicense)

export default router
