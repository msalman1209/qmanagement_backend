import pool from "../../../config/database.js"

export const createService = async (req, res) => {
  const { service_name, description, initial_ticket, color, parent_id } = req.body

  if (!service_name || !initial_ticket || !color) {
    return res.status(400).json({ success: false, message: "Service name, initial ticket, and color required" })
  }

  const connection = await pool.getConnection()
  try {
    await connection.query(
      "INSERT INTO services (service_name, description, initial_ticket, color, parent_id) VALUES (?, ?, ?, ?, ?)",
      [service_name, description || null, initial_ticket, color, parent_id || null]
    )

    res.status(201).json({ success: true, message: "Service created successfully" })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Service already exists" })
    }
    throw error
  } finally {
    connection.release()
  }
}
