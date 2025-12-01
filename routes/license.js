import express from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { authenticateToken, authorize } from "../middlewares/auth.js"
import { 
  getAdminInfo, 
  getAllAdmins,
  createLicense,
  getAllLicenses,
  getLicenseById,
  updateLicense,
  deleteLicense,
  getLicenseReport,
  uploadLicenseLogo,
  getLicenseByAdminId
} from "../controllers/license/index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for license logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/licenses"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "license-" + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Optional upload middleware
const optionalUpload = (req, res, next) => {
  upload.single("company_logo")(req, res, (err) => {
    if (err) {
      // If there's an error but no file was provided, continue
      if (!req.file) {
        return next()
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      })
    }
    next()
  })
}

const router = express.Router()

// Get admin info (Super Admin only)
router.get("/admin/:adminId", authenticateToken, authorize("super_admin"), getAdminInfo)

// Get all admins (Super Admin only)
router.get("/admins", authenticateToken, authorize("super_admin"), getAllAdmins)

// License Management Routes (Super Admin only)
router.post("/create", authenticateToken, authorize("super_admin"), optionalUpload, createLicense)
router.get("/all", authenticateToken, authorize("super_admin"), getAllLicenses)
router.get("/report", authenticateToken, authorize("super_admin"), getLicenseReport)
router.get("/:id", authenticateToken, authorize("super_admin"), getLicenseById)
router.put("/:id", authenticateToken, authorize("super_admin"), optionalUpload, updateLicense)
router.delete("/:id", authenticateToken, authorize("super_admin"), deleteLicense)

// Upload license logo (Admin only)
router.post("/upload-logo", authenticateToken, authorize("admin", "super_admin"), upload.single("company_logo"), uploadLicenseLogo)

// Get license by admin ID (Admin can get their own)
router.get("/admin-license/:adminId", authenticateToken, getLicenseByAdminId)

export default router
