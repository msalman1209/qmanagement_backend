import pool from '../../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current counter display configuration
export const getCounterDisplayConfig = async (req, res) => {
  try {
    const { adminId } = req.query;
    const userRole = req.user?.role;
    
    // Determine which admin's config to fetch
    let targetAdminId;
    console.log('🔍 Get Config - adminId from query:', adminId, 'user role:', userRole);
    
    if (adminId) {
      targetAdminId = parseInt(adminId);
      console.log('  ✅ Using adminId from query:', targetAdminId);
    } else if (userRole === 'admin') {
      targetAdminId = req.user.id;
      console.log('  ✅ Using admin user id:', targetAdminId);
    } else if (userRole === 'user' || userRole === 'ticket_info' || userRole === 'receptionist') {
      targetAdminId = req.user.admin_id;
      console.log(`  ✅ Using ${userRole} admin_id:`, targetAdminId);
    } else {
      // Super admin without specific adminId - return default or first config
      console.log('  ⚠️ WARNING: No adminId found, using default 1');
      targetAdminId = 1;
    }
    
    console.log('  📌 Final targetAdminId for get config:', targetAdminId);

    const [configs] = await pool.query('SELECT * FROM counter_display_config WHERE admin_id = ?', [targetAdminId]);
    const config = configs[0];

    const [images] = await pool.query('SELECT * FROM slider_images WHERE admin_id = ? ORDER BY display_order ASC', [targetAdminId]);

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
      selectedImageIds,
      admin_id
    } = req.body;

    const userRole = req.user?.role;
    
    // Determine which admin's config to update
    let targetAdminId;
    
    console.log('🔍 Counter Display - Debug Info:');
    console.log('  admin_id from body:', admin_id);
    console.log('  user role:', userRole);
    console.log('  user id:', req.user?.id);
    console.log('  user admin_id:', req.user?.admin_id);
    
    if (admin_id) {
      targetAdminId = parseInt(admin_id);
      console.log('  ✅ Using admin_id from body:', targetAdminId);
    } else if (userRole === 'admin') {
      targetAdminId = req.user.id;
      console.log('  ✅ Using admin user id:', targetAdminId);
    } else if (userRole === 'user') {
      targetAdminId = req.user.admin_id;
      console.log('  ✅ Using user admin_id:', targetAdminId);
    } else {
      // This should rarely happen - super admin without admin_id specified
      console.log('  ⚠️ WARNING: No admin_id found, using default 1');
      targetAdminId = 1;
    }
    
    console.log('  📌 Final targetAdminId:', targetAdminId);

    // Check if config exists for this admin
    const [existing] = await pool.query('SELECT id FROM counter_display_config WHERE admin_id = ?', [targetAdminId]);
    
    if (existing.length === 0) {
      // Insert new config for this admin
      await pool.query(
        `INSERT INTO counter_display_config (admin_id, left_logo_url, right_logo_url, screen_type, content_type, video_url, slider_timer, ticker_content)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [targetAdminId, leftLogoUrl, rightLogoUrl, screenType, contentType, videoUrl, sliderTimer, tickerContent]
      );
    } else {
      // Update existing config
      await pool.query(
        `UPDATE counter_display_config 
         SET left_logo_url = ?, 
             right_logo_url = ?, 
             screen_type = ?, 
             content_type = ?,
             video_url = ?,
             slider_timer = ?,
             ticker_content = ?
         WHERE admin_id = ?`,
        [leftLogoUrl, rightLogoUrl, screenType, contentType, videoUrl, sliderTimer, tickerContent, targetAdminId]
      );
    }

    // Update selected images for this admin only
    if (selectedImageIds && Array.isArray(selectedImageIds)) {
      // First, mark all images of this admin as not selected
      await pool.query('UPDATE slider_images SET is_selected = 0 WHERE admin_id = ?', [targetAdminId]);

      // Then mark selected images
      if (selectedImageIds.length > 0) {
        const placeholders = selectedImageIds.map(() => '?').join(',');
        await pool.query(
          `UPDATE slider_images SET is_selected = 1 WHERE admin_id = ? AND id IN (${placeholders})`,
          [targetAdminId, ...selectedImageIds]
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

    const { admin_id } = req.body;
    const userRole = req.user?.role;
    
    // Determine admin_id for images
    let targetAdminId;
    console.log('🔍 Upload Images - admin_id from body:', admin_id, 'user role:', userRole);
    
    if (admin_id) {
      targetAdminId = parseInt(admin_id);
      console.log('  ✅ Using admin_id from body:', targetAdminId);
    } else if (userRole === 'admin') {
      targetAdminId = req.user.id;
      console.log('  ✅ Using admin user id:', targetAdminId);
    } else if (userRole === 'user') {
      targetAdminId = req.user.admin_id;
      console.log('  ✅ Using user admin_id:', targetAdminId);
    } else {
      console.log('  ⚠️ WARNING: No admin_id found, using default 1');
      targetAdminId = 1;
    }
    
    console.log('  📌 Final targetAdminId for images:', targetAdminId);

    // Get current max display_order for this admin
    const [maxOrderResult] = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM slider_images WHERE admin_id = ?',
      [targetAdminId]
    );
    let displayOrder = maxOrderResult[0].maxOrder;

    const uploadedImages = [];

    for (const file of req.files) {
      displayOrder++; // Increment for each new image
      const imageUrl = `/uploads/${file.filename}`;
      
      const [result] = await pool.query(
        'INSERT INTO slider_images (admin_id, image_url, image_name, display_order) VALUES (?, ?, ?, ?)',
        [targetAdminId, imageUrl, file.originalname, displayOrder]
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
    const { admin_id } = req.body;
    const userRole = req.user?.role;
    
    // Determine admin_id
    let targetAdminId;
    console.log('🔍 Upload Logo - admin_id from body:', admin_id, 'user role:', userRole);
    
    if (admin_id) {
      targetAdminId = parseInt(admin_id);
      console.log('  ✅ Using admin_id from body:', targetAdminId);
    } else if (userRole === 'admin') {
      targetAdminId = req.user.id;
      console.log('  ✅ Using admin user id:', targetAdminId);
    } else if (userRole === 'user') {
      targetAdminId = req.user.admin_id;
      console.log('  ✅ Using user admin_id:', targetAdminId);
    } else {
      console.log('  ⚠️ WARNING: No admin_id found, using default 1');
      targetAdminId = 1;
    }
    
    console.log('  📌 Final targetAdminId for logo:', targetAdminId);

    const field = logoType === 'left' ? 'left_logo_url' : 'right_logo_url';

    // Check if config exists for this admin
    const [configs] = await pool.query('SELECT id FROM counter_display_config WHERE admin_id = ?', [targetAdminId]);
    
    if (configs.length === 0) {
      // Insert default config first
      await pool.query(
        `INSERT INTO counter_display_config (admin_id, ${field}, ticker_content) VALUES (?, ?, ?)`,
        [targetAdminId, logoUrl, 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C']
      );
    } else {
      // Update existing config
      await pool.query(
        `UPDATE counter_display_config SET ${field} = ? WHERE admin_id = ?`,
        [logoUrl, targetAdminId]
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
    console.log('🎬 uploadVideo controller called');
    console.log('📦 req.file:', req.file ? {
      filename: req.file.filename,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + 'MB',
      mimetype: req.file.mimetype,
      path: req.file.path
    } : 'MISSING');
    console.log('📋 req.body:', req.body);
    console.log('👤 req.user:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      admin_id: req.user.admin_id
    } : 'MISSING');
    
    if (!req.file) {
      console.error('❌ No file in request!');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        debug: 'req.file is undefined - multer did not process the file',
      });
    }

    const videoUrl = `/uploads/${req.file.filename}`;
    const { admin_id } = req.body;
    const userRole = req.user?.role;
    
    // Determine admin_id
    let targetAdminId;
    console.log('🔍 Upload Video - admin_id from body:', admin_id, 'user role:', userRole);
    
    if (admin_id) {
      targetAdminId = parseInt(admin_id);
      console.log('  ✅ Using admin_id from body:', targetAdminId);
    } else if (userRole === 'admin') {
      targetAdminId = req.user.id;
      console.log('  ✅ Using admin user id:', targetAdminId);
    } else if (userRole === 'user') {
      targetAdminId = req.user.admin_id;
      console.log('  ✅ Using user admin_id:', targetAdminId);
    } else {
      console.log('  ⚠️ WARNING: No admin_id found, using default 1');
      targetAdminId = 1;
    }
    
    console.log('  📌 Final targetAdminId for video:', targetAdminId);

    // Check if config exists for this admin
    const [configs] = await pool.query('SELECT id FROM counter_display_config WHERE admin_id = ?', [targetAdminId]);
    
    if (configs.length === 0) {
      console.log('📝 Creating new config for admin:', targetAdminId);
      // Insert default config first
      await pool.query(
        'INSERT INTO counter_display_config (admin_id, video_url, content_type, ticker_content) VALUES (?, ?, ?, ?)',
        [targetAdminId, videoUrl, 'video', 'Welcome to HAPPINESS LOUNGE BUSINESSMEN SERVICES L.L.C']
      );
    } else {
      console.log('📝 Updating existing config for admin:', targetAdminId);
      // Update existing config
      await pool.query(
        'UPDATE counter_display_config SET video_url = ?, content_type = ? WHERE admin_id = ?',
        [videoUrl, 'video', targetAdminId]
      );
    }

    console.log('✅ Video uploaded successfully:', videoUrl);
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

// Delete video
export const deleteVideo = async (req, res) => {
  try {
    const { admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    // Get video info first
    const [configs] = await pool.query(
      'SELECT video_url FROM counter_display_config WHERE admin_id = ?',
      [admin_id]
    );

    if (!configs || configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const videoUrl = configs[0].video_url;

    if (!videoUrl) {
      return res.status(404).json({
        success: false,
        message: 'No video found to delete'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', videoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update database to clear video_url
    await pool.query(
      'UPDATE counter_display_config SET video_url = NULL WHERE admin_id = ?',
      [admin_id]
    );

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
};
