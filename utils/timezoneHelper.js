/**
 * Backend Timezone Helper
 * Converts times to admin's timezone for storage and display
 */

import pool from '../config/database.js';

/**
 * Get admin's timezone from database
 * @param {number} adminId - Admin ID
 * @returns {Promise<string>} - Timezone offset like "+05:00"
 */
export const getAdminTimezone = async (adminId) => {
  try {
    const connection = await pool.getConnection();
    const [admins] = await connection.query(
      "SELECT timezone FROM admin WHERE id = ?",
      [adminId]
    );
    connection.release();

    if (admins.length > 0 && admins[0].timezone) {
      return admins[0].timezone;
    }
    return '+05:00'; // Default to PKT
  } catch (error) {
    console.error('Error getting admin timezone:', error);
    return '+05:00';
  }
};

/**
 * Convert UTC time to admin's timezone
 * @param {Date|string} utcTime - UTC time to convert
 * @param {string} timezoneOffset - Timezone offset like "+05:00"
 * @returns {string} - Time string in admin's timezone as YYYY-MM-DD HH:MM:SS
 */
export const convertUTCToTimezone = (utcTime, timezoneOffset) => {
  if (!utcTime || !timezoneOffset) {
    const date = new Date(utcTime);
    return date.toISOString().replace('T', ' ').split('.')[0];
  }

  try {
    const date = new Date(utcTime);
    
    // Parse offset like "+05:00" or "-05:00"
    const sign = timezoneOffset[0] === '+' ? 1 : -1;
    const [hours, minutes] = timezoneOffset.slice(1).split(':').map(Number);
    
    // Get UTC time in milliseconds
    const utcMs = date.getTime();
    
    // Apply timezone offset (convert UTC to local time)
    const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
    const localMs = utcMs + offsetMs;
    
    // Create a new date from the adjusted milliseconds
    // But then read it as if it's UTC (since we already applied the offset)
    const localDate = new Date(localMs);
    
    // Now read the components as UTC (since localMs already has offset applied)
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours_str = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes_str = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours_str}:${minutes_str}:${seconds}`;
  } catch (error) {
    console.error('Error converting timezone:', error);
    const date = new Date(utcTime);
    return date.toISOString().replace('T', ' ').split('.')[0];
  }
};

/**
 * Get current datetime in admin's timezone as string for database storage
 * @param {string} timezoneOffset - Timezone offset like "+05:00"
 * @returns {string} - Current time in that timezone as YYYY-MM-DD HH:MM:SS
 */
export const getCurrentTimeInTimezone = (timezoneOffset) => {
  const now = new Date();
  return convertUTCToTimezone(now, timezoneOffset);
};

/**
 * Format time for display with timezone info
 * @param {Date|string} time - Time to format
 * @param {string} timezoneOffset - Timezone offset
 * @returns {string} - Formatted time string
 */
export const formatTimeWithTimezone = (time, timezoneOffset) => {
  const localDate = convertUTCToTimezone(new Date(time), timezoneOffset);
  return localDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
