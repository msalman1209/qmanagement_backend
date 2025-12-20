import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createService, getAllServices, getAdminServices, updateService, deleteService, assignServicesToUser, getUserAssignedServices, getAdminAssignedServices, deleteUserServices } from '../controllers/services/index.js';
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
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file allowed
  },
  fileFilter: (req, file, cb) => {
    console.log('📤 Backend received file:', file.originalname, file.mimetype, file.size);
    
    // If no file provided, skip validation
    if (!file) {
      return cb(null, false);
    }
    
    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp'
    ];
    
    // Allowed extensions
    const allowedExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      console.log('✅ File validation passed');
      return cb(null, true);
    } else {
      console.log('❌ File validation failed - Invalid type');
      return cb(new Error('Invalid file type. Only JPG, PNG, GIF, SVG, and WebP images are allowed.'));
    }
  }
});

// Middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.error('❌ File validation error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // File uploaded successfully or no file provided
    if (req.file) {
      console.log('✅ File uploaded successfully:', req.file.filename);
    } else {
      console.log('ℹ️ No file uploaded (optional)');
    }
    next();
  });
};

// Routes
router.post('/create', authenticateToken, optionalUpload, createService);
router.get('/all', authenticateToken, getAllServices);
router.get('/admin/:adminId', authenticateToken, getAdminServices);
router.put('/update/:id', authenticateToken, optionalUpload, updateService);
router.delete('/delete/:id', authenticateToken, deleteService);

// User service assignment routes (no file upload needed)
router.post('/assign', authenticateToken, assignServicesToUser);
router.get('/assigned', authenticateToken, getUserAssignedServices);
router.get('/assigned/admin/:adminId', authenticateToken, getAdminAssignedServices);
router.get('/user/:id', authenticateToken, getUserAssignedServices); // Get services for specific user
router.delete('/assigned/:user_id', authenticateToken, deleteUserServices);

export default router;
