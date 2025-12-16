import express from 'express';
import { updateAdminTimezone, getTimezonesList, getAdminTimezoneAPI } from '../controllers/admin/timezoneController.js';

const router = express.Router();

// Get admin's timezone by ID
router.get('/admin/timezone/:admin_id', getAdminTimezoneAPI);

// Update admin timezone
router.post('/admin/timezone', updateAdminTimezone);

// Get available timezones
router.get('/timezones', getTimezonesList);

export default router;
