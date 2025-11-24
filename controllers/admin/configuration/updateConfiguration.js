import pool from "../../../config/database.js"

export const updateConfiguration = async (req, res) => {
  const { setting_name, setting_value } = req.body

  if (!setting_name || setting_value === undefined) {
    return res.status(400).json({ success: false, message: "Setting name and value required" })
  }

  const connection = await pool.getConnection()
  try {
    await connection.query(
      "INSERT INTO admin_btn_settings (setting_name, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [setting_name, setting_value, setting_value]
    )

    res.json({ success: true, message: "Configuration updated successfully" })
  } finally {
    connection.release()
  }
}
