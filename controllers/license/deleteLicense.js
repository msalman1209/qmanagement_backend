import pool from "../../config/database.js"

export const deleteLicense = async (req, res) => {
  try {
    const { id } = req.params

    // Check if license exists
    const [existing] = await pool.query(
      "SELECT id FROM licenses WHERE id = ?",
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found"
      })
    }

    // Delete the license
    await pool.query("DELETE FROM licenses WHERE id = ?", [id])

    res.status(200).json({
      success: true,
      message: "License deleted successfully"
    })
  } catch (error) {
    console.error("Delete license error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete license",
      error: error.message 
    })
  }
}
