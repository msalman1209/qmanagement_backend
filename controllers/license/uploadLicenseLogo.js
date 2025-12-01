import pool from "../../config/database.js"

export const uploadLicenseLogo = async (req, res) => {
  try {
    const { adminId } = req.body
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      })
    }

    const company_logo = `/uploads/licenses/${req.file.filename}`

    // Update the license with the new logo
    const [result] = await pool.query(
      "UPDATE licenses SET company_logo = ? WHERE admin_id = ?",
      [company_logo, adminId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "License not found for this admin"
      })
    }

    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        company_logo
      }
    })
  } catch (error) {
    console.error("Upload license logo error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload logo",
      error: error.message
    })
  }
}
