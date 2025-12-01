import pool from "../../config/database.js"

export const deleteLicense = async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    const { id } = req.params

    await connection.beginTransaction()

    // Check if license exists and get admin info
    const [existing] = await connection.query(
      "SELECT id, admin_id, license_key FROM licenses WHERE id = ?",
      [id]
    )

    if (existing.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: "License not found"
      })
    }

    const license = existing[0]

    // Update admin's license_key to NULL
    await connection.query(
      "UPDATE admin SET license_key = NULL, license_expiry_date = NULL WHERE id = ?",
      [license.admin_id]
    )

    // Delete the license (this will also cascade delete if properly configured)
    await connection.query("DELETE FROM licenses WHERE id = ?", [id])

    await connection.commit()

    res.status(200).json({
      success: true,
      message: "License deleted successfully",
      deleted_license_key: license.license_key
    })
  } catch (error) {
    await connection.rollback()
    console.error("Delete license error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete license",
      error: error.message 
    })
  } finally {
    connection.release()
  }
}
