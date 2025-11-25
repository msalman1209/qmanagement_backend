import pool from "../../../config/database.js"

export const deleteAdmin = async (req, res) => {
  // Check if current user is super admin
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Only super admins can delete other admins" 
    })
  }

  const { adminId } = req.params

  // Prevent self-deletion
  if (parseInt(adminId) === req.user.id) {
    return res.status(400).json({ 
      success: false, 
      message: "You cannot delete your own account" 
    })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Check if admin exists
    const [admins] = await connection.query(
      "SELECT id FROM admin WHERE id = ? AND role IN ('admin', 'super_admin')", 
      [adminId]
    )

    if (admins.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    // Delete permissions first (cascading will handle this automatically with FK constraint)
    await connection.query("DELETE FROM admin_permissions WHERE admin_id = ?", [adminId])

    // Delete admin
    await connection.query("DELETE FROM admin WHERE id = ?", [adminId])

    await connection.commit()

    res.json({ success: true, message: "Admin deleted successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Delete admin error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete admin" 
    })
  } finally {
    connection.release()
  }
}
