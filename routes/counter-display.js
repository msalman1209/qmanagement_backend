import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middlewares/auth.js';
import * as counterDisplayController from '../controllers/counter-display/counterDisplayController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024 // 250MB limit - increased for production
  }
});

// Get current configuration
router.get('/config', authenticateToken, counterDisplayController.getCounterDisplayConfig);

// Update configuration
router.post('/config', authenticateToken, counterDisplayController.updateCounterDisplayConfig);

// Upload logo (left or right)
router.post('/upload-logo', authenticateToken, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('Multer error (logo):', err);
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
}, counterDisplayController.uploadLogo);

// Upload video
router.post('/upload-video', authenticateToken, (req, res, next) => {
  console.log('🎬 Upload video route hit');
  console.log('📦 Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
  });
  
  // Increase timeout for large file uploads
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error (video):', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File size is too large. Maximum allowed is 500MB.',
          error: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message,
        error: err.message
      });
    }
    
    console.log('✅ Multer processed successfully');
    console.log('📁 File received:', req.file ? {
      filename: req.file.filename,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + 'MB',
      mimetype: req.file.mimetype
    } : 'No file');
    console.log('📋 Body data:', req.body);
    
    next();
  });
}, counterDisplayController.uploadVideo);

// Upload multiple slider images
router.post('/upload-images', authenticateToken, (req, res, next) => {
  upload.array('images', 20)(req, res, (err) => {
    if (err) {
      console.error('Multer error (images):', err);
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
}, counterDisplayController.uploadSliderImages);

// Delete slider image
router.delete('/image/:id', authenticateToken, counterDisplayController.deleteSliderImage);

// Delete video
router.post('/delete-video', authenticateToken, counterDisplayController.deleteVideo);

export default router;
