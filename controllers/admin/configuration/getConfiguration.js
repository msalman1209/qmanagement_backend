import pool from "../../../config/database.js"

export const getConfiguration = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const [settings] = await connection.query("SELECT * FROM admin_btn_settings")

    const config = {}
    settings.forEach(setting => {
      config[setting.setting_name] = setting.setting_value
    })

    res.json({ success: true, configuration: config })
  } finally {
    connection.release()
  }
}
