import pool from "../../../config/database.js"

export const updateService = async (req, res) => {
  const { serviceId } = req.params
  const { service_name, description, initial_ticket, color, parent_id } = req.body

  const connection = await pool.getConnection()
  try {
    const [services] = await connection.query("SELECT id FROM services WHERE id = ?", [serviceId])

    if (services.length === 0) {
      return res.status(404).json({ success: false, message: "Service not found" })
    }

    await connection.query(
      "UPDATE services SET service_name = ?, description = ?, initial_ticket = ?, color = ?, parent_id = ? WHERE id = ?",
      [service_name, description || null, initial_ticket, color, parent_id || null, serviceId]
    )

    res.json({ success: true, message: "Service updated successfully" })
  } finally {
    connection.release()
  }
}
