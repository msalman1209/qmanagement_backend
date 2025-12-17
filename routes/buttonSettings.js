import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/button-settings
 * Get current button settings (accessible by all authenticated users)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT setting_name, setting_value FROM admin_btn_settings WHERE setting_name IN (?, ?)',
      ['show_next_button', 'show_transfer_button']
    );

    // Convert to object format
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
 * PUT /api/button-settings
 * Update button settings (admin only)
 */
router.put('/', authenticateToken, authorize('admin', 'super_admin'), async (req, res) => {
  try {
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

      // Update show_next_button
      await connection.query(
        `UPDATE admin_btn_settings SET setting_value = ? WHERE setting_name = ?`,
        [showNextButton ? 'true' : 'false', 'show_next_button']
      );

      // Update show_transfer_button
      await connection.query(
        `UPDATE admin_btn_settings SET setting_value = ? WHERE setting_name = ?`,
        [showTransferButton ? 'true' : 'false', 'show_transfer_button']
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
