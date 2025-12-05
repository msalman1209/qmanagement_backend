import express from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVoiceSettings, saveVoiceSettings, deleteVoiceSettings } from '../controllers/voice-settings/voiceSettingsController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python TTS Service URL
const PYTHON_TTS_URL = process.env.PYTHON_TTS_URL || 'http://localhost:3002';

// Configure multer for voice sample uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/voices/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = /\.(wav|mp3|ogg|m4a|mpeg|x-m4a)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // Check mimetype - be more flexible with audio types
    const allowedMimeTypes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4'
    ];
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype.toLowerCase());
    
    // Accept if either extension is valid OR mimetype is valid
    if (extname || mimetypeValid) {
      return cb(null, true);
    } else {
      cb(new Error(`Only audio files are allowed (wav, mp3, ogg, m4a). Received: ${file.mimetype}`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/voices/synthesize
 * @desc    Generate speech using ChatterBox voice cloning
 * @access  Public
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, language, rate, pitch, voiceId } = req.body;
    
    console.log('🎙️ Synthesis request received:', { text, language, rate, pitch, voiceId });
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    // Forward request to Python TTS service
    const { voiceType } = req.body;
    const response = await axios.post(
      `${PYTHON_TTS_URL}/api/tts/synthesize`,
      {
        text,
        language: language || 'en',
        speed: rate || 1.0,
        pitch: pitch || 1.0,
        voice_type: voiceType || 'default',
        voice_sample: voiceId
      },
      {
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('✅ Python service response:', response.data);
    
    // Check if Python service returned an error
    if (!response.data || response.data.error) {
      console.error('❌ Python service error:', response.data?.error);
      return res.status(500).json({
        success: false,
        message: response.data?.error || 'Python service returned an error'
      });
    }
    
    // Convert Python service response to frontend format
    if (!response.data.audio_url) {
      console.error('❌ No audio_url in response:', response.data);
      return res.status(500).json({
        success: false,
        message: 'Audio generation failed - no audio URL returned'
      });
    }
    
    const audioUrl = `${PYTHON_TTS_URL}${response.data.audio_url}`;
    console.log('🔊 Audio URL:', audioUrl);
    
    res.json({
      success: true,
      audioUrl: audioUrl,
      message: response.data.message || 'Speech synthesized successfully'
    });
    
  } catch (error) {
    console.error('Voice synthesis error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'TTS service is not available. Please ensure Python service is running.',
        error: 'Service unavailable'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to synthesize speech',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/voices/upload
 * @desc    Upload a voice sample for cloning
 * @access  Public
 */
router.post('/upload', upload.single('voice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No voice file uploaded'
      });
    }
    
    const { name, description } = req.body;
    const voiceFilePath = req.file.path;
    
    // TODO: Optionally forward to Python service for processing
    // For now, just store locally and return metadata
    
    res.json({
      success: true,
      message: 'Voice sample uploaded successfully',
      data: {
        voiceId: req.file.filename,
        name: name || req.file.originalname,
        description: description || '',
        path: `/uploads/voices/${req.file.filename}`,
        size: req.file.size,
        uploadedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Voice upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload voice sample',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voices/list
 * @desc    Get list of available voices
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    const voices = [];
    
    // Add default/system voices
    voices.push(
      { id: 'default', name: 'Default System Voice', type: 'system' },
      { id: 'male-1', name: 'Male Voice 1', type: 'system' },
      { id: 'female-1', name: 'Female Voice 1', type: 'system' }
    );
    
    // Get uploaded voices from local uploads folder
    try {
      const fs = await import('fs');
      const uploadPath = path.join(__dirname, '../uploads/voices/');
      
      if (fs.existsSync(uploadPath)) {
        const files = fs.readdirSync(uploadPath);
        files.forEach(file => {
          if (file.match(/\.(wav|mp3|ogg|m4a)$/i)) {
            voices.push({
              id: file,
              name: file.replace(/^voice-\d+-\d+-/, '').replace(/\.(wav|mp3|ogg|m4a)$/i, ''),
              type: 'uploaded',
              path: `/uploads/voices/${file}`
            });
          }
        });
      }
    } catch (fsError) {
      console.error('Error reading uploaded voices:', fsError.message);
    }
    
    // Try to get voices from Python service
    try {
      const response = await axios.get(`${PYTHON_TTS_URL}/api/tts/voices`, {
        timeout: 5000
      });
      
      if (response.data.success && response.data.voices) {
        response.data.voices.forEach(voice => {
          voices.push({
            ...voice,
            type: 'cloned'
          });
        });
      }
    } catch (serviceError) {
      // Python service not available, that's okay
      console.log('Python TTS service not available for voices list');
    }
    
    return res.json({
      success: true,
      data: voices
    });
    
  } catch (error) {
    console.error('List voices error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voices/health
 * @desc    Check TTS service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_TTS_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      status: 'ok',
      success: true,
      python_service: 'online',
      data: response.data
    });
    
  } catch (error) {
    res.json({
      status: 'error',
      success: false,
      python_service: 'offline',
      message: 'TTS service is not running',
      hint: 'Start the Python service with: cd python-tts-service && python app.py'
    });
  }
});

/**
 * @route   DELETE /api/voices/:voiceId
 * @desc    Delete a voice sample
 * @access  Public
 */
router.delete('/:voiceId', async (req, res) => {
  try {
    const { voiceId } = req.params;
    const voicePath = path.join(__dirname, '../uploads/voices/', voiceId);
    
    const fs = await import('fs');
    
    if (fs.existsSync(voicePath)) {
      fs.unlinkSync(voicePath);
      res.json({
        success: true,
        message: 'Voice sample deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Voice sample not found'
      });
    }
    
  } catch (error) {
    console.error('Delete voice error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voice sample',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voices/settings
 * @desc    Get voice settings for current admin
 * @access  Public
 */
router.get('/settings', getVoiceSettings);

/**
 * @route   POST /api/voices/settings
 * @desc    Save voice settings
 * @access  Public
 */
router.post('/settings', saveVoiceSettings);

/**
 * @route   DELETE /api/voices/settings
 * @desc    Delete voice settings
 * @access  Public
 */
router.delete('/settings', deleteVoiceSettings);

export default router;
