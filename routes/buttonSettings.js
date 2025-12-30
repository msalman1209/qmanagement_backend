import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/button-settings/:adminId
 * Get current button settings for a specific admin
 */
router.get('/:adminId', authenticateToken, async (req, res) => {
  try {
    const { adminId } = req.params;

    const [settings] = await pool.query(
      'SELECT setting_name, setting_value FROM admin_btn_settings WHERE admin_id = ? AND setting_name IN (?, ?)',
      [adminId, 'show_next_button', 'show_transfer_button']
    );

    // Convert to object format with defaults
    const settingsObj = {
      showNextButton: true,
      showTransferButton: true
    };

    settings.forEach(setting => {
      if (setting.setting_name === 'show_next_button') {
        settingsObj.showNextButton = setting.setting_value === 'true';
      } else if (setting.setting_name === 'show_transfer_button') {
        settingsObj.showTransferButton = setting.setting_value === 'true';
      }
    });

    res.json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('Error fetching button settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch button settings'
    });
  }
});

/**
 * PUT /api/button-settings/:adminId
 * Update button settings for a specific admin
 */
router.put('/:adminId', authenticateToken, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { showNextButton, showTransferButton } = req.body;

    // Validate input
    if (typeof showNextButton !== 'boolean' || typeof showTransferButton !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings format'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update or insert show_next_button for this admin
      await connection.query(
        `INSERT INTO admin_btn_settings (admin_id, setting_name, setting_value) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [adminId, 'show_next_button', showNextButton ? 'true' : 'false', showNextButton ? 'true' : 'false']
      );

      // Update or insert show_transfer_button for this admin
      await connection.query(
        `INSERT INTO admin_btn_settings (admin_id, setting_name, setting_value) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [adminId, 'show_transfer_button', showTransferButton ? 'true' : 'false', showTransferButton ? 'true' : 'false']
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Button settings updated successfully',
        settings: {
          showNextButton,
          showTransferButton
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating button settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update button settings'
    });
  }
});

export default router;
