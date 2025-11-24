import pool from "../../../config/database.js"

export const assignServiceToUser = async (req, res) => {
  const { user_id, service_id } = req.body

  if (!user_id || !service_id) {
    return res.status(400).json({ success: false, message: "User ID and Service ID required" })
  }

  const connection = await pool.getConnection()
  try {
    await connection.query("INSERT INTO user_services (user_id, service_id) VALUES (?, ?)", [user_id, service_id])

    res.status(201).json({ success: true, message: "Service assigned to user successfully" })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Service already assigned to this user" })
    }
    throw error
  } finally {
    connection.release()
  }
}
