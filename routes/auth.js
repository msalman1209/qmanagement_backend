import express from "express"
import { authenticateToken } from "../middlewares/auth.js"
import {
  superAdminLogin,
  adminLogin,
  userLogin,
  logout,
  getCurrentUser,
  verifyCurrentSession,
  setUserCounter,
} from "../controllers/auth/index.js"

const router = express.Router()

// Super Admin Login
router.post("/super-admin/login", superAdminLogin)

// Admin Login
router.post("/admin/login", adminLogin)

// User Login
router.post("/user/login", userLogin)

// Logout
router.post("/logout", authenticateToken, logout)

// Get current user
router.get("/me", authenticateToken, getCurrentUser)

// Verify current session and license
router.get("/verify", authenticateToken, verifyCurrentSession)

// Set user counter (after login)
router.post("/user/set-counter", authenticateToken, setUserCounter)

export default router
