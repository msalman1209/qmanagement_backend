import pool from '../../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current counter display configuration
export const getCounterDisplayConfig = async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM counter_display_config WHERE id = 1');
    const config = configs[0];

    const [images] = await pool.query('SELECT * FROM slider_images ORDER BY display_order ASC');

    res.json({
      success: true,
      config: config || {},
      images: images || []
    });
  } catch (error) {
    console.error('Error fetching counter display config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counter display configuration',
      error: error.message
    });
  }
};

// Update counter display configuration
export const updateCounterDisplayConfig = async (req, res) => {
  try {
    const {
      leftLogoUrl,
      rightLogoUrl,
      screenType,
      contentType,
      videoUrl,
      sliderTimer,
      tickerContent,
      selectedImageIds
    } = req.body;

    // Update main config
    await pool.query(
      `UPDATE counter_display_config 
       SET left_logo_url = ?, 
           right_logo_url = ?, 
           screen_type = ?, 
           content_type = ?,
           video_url = ?,
           slider_timer = ?,
           ticker_content = ?
       WHERE id = 1`,
      [leftLogoUrl, rightLogoUrl, screenType, contentType, videoUrl, sliderTimer, tickerContent]
    );

    // Update selected images
    if (selectedImageIds && Array.isArray(selectedImageIds)) {
      // First, mark all images as not selected
      await pool.query('UPDATE slider_images SET is_selected = 0');

      // Then mark selected images
      if (selectedImageIds.length > 0) {
        const placeholders = selectedImageIds.map(() => '?').join(',');
        await pool.query(
          `UPDATE slider_images SET is_selected = 1 WHERE id IN (${placeholders})`,
          selectedImageIds
        );
      }
    }

    res.json({
      success: true,
      message: 'Counter display configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating counter display config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update counter display configuration',
      error: error.message
    });
  }
};

// Upload and save slider images
export const uploadSliderImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      
      const [result] = await pool.query(
        'INSERT INTO slider_images (image_url, image_name, display_order) VALUES (?, ?, ?)',
        [imageUrl, file.originalname, Date.now()]
      );

      uploadedImages.push({
        id: result.insertId,
        imageUrl,
        imageName: file.originalname
      });
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading slider images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// Upload logo (left or right)
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const logoType = req.body.logoType; // 'left' or 'right'

    const field = logoType === 'left' ? 'left_logo_url' : 'right_logo_url';

    // Check if config exists, if not create it
    const [configs] = await pool.query('SELECT id FROM counter_display_config WHERE id = 1');
    
    if (configs.length === 0) {
      // Insert default config first
      await pool.query(
        `INSERT INTO counter_display_config (id, ${field}, ticker_content) VALUES (1, ?, ?)`,
        [logoUrl, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C']
      );
    } else {
      // Update existing config
      await pool.query(
        `UPDATE counter_display_config SET ${field} = ? WHERE id = 1`,
        [logoUrl]
      );
    }

    res.json({
      success: true,
      message: `${logoType} logo uploaded successfully`,
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

// Upload video
export const uploadVideo = async (req, res) => {
  try {
    console.log('uploadVideo req.file:', req.file);
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        debug: 'req.file is undefined',
      });
    }

    const videoUrl = `/uploads/${req.file.filename}`;

    // Check if config exists, if not create it
    const [configs] = await pool.query('SELECT id FROM counter_display_config WHERE id = 1');
    
    if (configs.length === 0) {
      // Insert default config first
      await pool.query(
        'INSERT INTO counter_display_config (id, video_url, content_type, ticker_content) VALUES (1, ?, ?, ?)',
        [videoUrl, 'video', 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C']
      );
    } else {
      // Update existing config
      await pool.query(
        'UPDATE counter_display_config SET video_url = ?, content_type = ? WHERE id = 1',
        [videoUrl, 'video']
      );
    }

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      videoUrl: videoUrl
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
};

// Delete slider image
export const deleteSliderImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Get image info first
    const [images] = await pool.query('SELECT * FROM slider_images WHERE id = ?', [id]);
    const image = images[0];

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from database
    await pool.query('DELETE FROM slider_images WHERE id = ?', [id]);

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', image.image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting slider image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};
