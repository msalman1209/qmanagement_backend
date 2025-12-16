import pool from "../../config/database.js"

// Get admin's timezone
export const getAdminTimezone = async (admin_id) => {
  try {
    const connection = await pool.getConnection();
    const [admins] = await connection.query(
      "SELECT timezone FROM admin WHERE id = ?",
      [admin_id]
    );
    connection.release();
    
    if (admins.length > 0 && admins[0].timezone) {
      return admins[0].timezone;
    }
    return '+05:00'; // Default to Pakistan timezone
  } catch (error) {
    console.error('Error getting admin timezone:', error);
    return '+05:00';
  }
};

// Get admin timezone by ID (API endpoint)
export const getAdminTimezoneAPI = async (req, res) => {
  const { admin_id } = req.params;

  if (!admin_id) {
    return res.status(400).json({ 
      success: false, 
      message: "Admin ID is required" 
    });
  }

  try {
    const connection = await pool.getConnection();
    const [admins] = await connection.query(
      "SELECT timezone FROM admin WHERE id = ?",
      [admin_id]
    );
    connection.release();

    if (admins.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    const timezone = admins[0].timezone || '+05:00';
    res.json({ 
      success: true, 
      timezone 
    });
  } catch (error) {
    console.error('Error getting admin timezone:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch timezone" 
    });
  }
};

// Update admin timezone
export const updateAdminTimezone = async (req, res) => {
  const { admin_id, timezone } = req.body;

  if (!admin_id || !timezone) {
    return res.status(400).json({ 
      success: false, 
      message: "Admin ID and timezone are required" 
    });
  }

  // Validate timezone format
  const timezoneRegex = /^[+-]\d{2}:\d{2}$/;
  if (!timezoneRegex.test(timezone)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid timezone format. Use +HH:MM or -HH:MM" 
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE admin SET timezone = ? WHERE id = ?",
      [timezone, admin_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Timezone updated successfully",
      timezone 
    });
  } catch (error) {
    console.error('Error updating timezone:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update timezone: " + error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get all timezones list
export const getTimezonesList = (req, res) => {
  const timezones = [
    { offset: '+05:00', name: 'Pakistan Standard Time (PKT)', region: 'Pakistan' },
    { offset: '+04:00', name: 'Gulf Standard Time (GST)', region: 'UAE, Saudi Arabia' },
    { offset: '+03:00', name: 'East Africa Time (EAT)', region: 'East Africa' },
    { offset: '+02:00', name: 'Central Africa Time (CAT)', region: 'Central Africa' },
    { offset: '+01:00', name: 'West Africa Time (WAT)', region: 'West Africa' },
    { offset: '+00:00', name: 'Coordinated Universal Time (UTC)', region: 'UTC' },
    { offset: '-05:00', name: 'Eastern Standard Time (EST)', region: 'USA East' },
    { offset: '-06:00', name: 'Central Standard Time (CST)', region: 'USA Central' },
    { offset: '-07:00', name: 'Mountain Standard Time (MST)', region: 'USA Mountain' },
    { offset: '-08:00', name: 'Pacific Standard Time (PST)', region: 'USA West' },
  ];

  res.json({ 
    success: true, 
    timezones 
  });
};
