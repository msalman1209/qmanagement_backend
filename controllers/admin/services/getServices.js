import pool from "../../../config/database.js"

export const getServices = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const [services] = await connection.query(
      "SELECT id, service_name, description, initial_ticket, color, parent_id FROM services"
    )
    res.json({ success: true, services })
  } finally {
    connection.release()
  }
}
