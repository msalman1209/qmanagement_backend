import pool from "../../../config/database.js"

export const deleteService = async (req, res) => {
  const { serviceId } = req.params

  const connection = await pool.getConnection()
  try {
    const [services] = await connection.query("SELECT id FROM services WHERE id = ?", [serviceId])

    if (services.length === 0) {
      return res.status(404).json({ success: false, message: "Service not found" })
    }

    await connection.query("DELETE FROM services WHERE id = ?", [serviceId])

    res.json({ success: true, message: "Service deleted successfully" })
  } finally {
    connection.release()
  }
}
