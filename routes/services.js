import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createService, getAllServices, updateService, deleteService, assignServicesToUser, getUserAssignedServices, deleteUserServices } from '../controllers/services/index.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/services');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // If no file provided, skip validation
    if (!file) {
      return cb(null, false);
    }
    
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(null, false); // Skip file instead of throwing error
    }
  }
});

// Middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    // Ignore multer errors for optional uploads
    if (err instanceof multer.MulterError) {
      // Skip multer errors
      return next();
    } else if (err) {
      // Skip other errors too
      return next();
    }
    next();
  });
};

// Routes
router.post('/create', authenticateToken, optionalUpload, createService);
router.get('/all', authenticateToken, getAllServices);
router.put('/update/:id', authenticateToken, optionalUpload, updateService);
router.delete('/delete/:id', authenticateToken, deleteService);

// User service assignment routes (no file upload needed)
router.post('/assign', authenticateToken, assignServicesToUser);
router.get('/assigned', authenticateToken, getUserAssignedServices);
router.get('/user/:id', authenticateToken, getUserAssignedServices); // Get services for specific user
router.delete('/assigned/:user_id', authenticateToken, deleteUserServices);

export default router;
