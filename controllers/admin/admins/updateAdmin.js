import pool from "../../../config/database.js"
import bcryptjs from "bcryptjs"

export const updateAdmin = async (req, res) => {
  // Check if current user is super admin
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Only super admins can update other admins" 
    })
  }

  const { adminId } = req.params
  const { 
    username, 
    email, 
    password, 
    licenseStartDate, 
    licenseEndDate,
    role,
    status,
    maxUsers,
    maxCounters,
    permissions
  } = req.body

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

    // Validate license dates if provided
    if (licenseStartDate && licenseEndDate) {
      const startDate = new Date(licenseStartDate)
      const endDate = new Date(licenseEndDate)
      
      if (endDate <= startDate) {
        await connection.rollback()
        return res.status(400).json({ 
          success: false, 
          message: "License end date must be after start date" 
        })
      }
    }

    // Build dynamic update query
    let updateFields = []
    let params = []

    if (username) {
      updateFields.push("username = ?")
      params.push(username)
    }
    if (email) {
      updateFields.push("email = ?")
      params.push(email)
    }
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10)
      updateFields.push("password = ?")
      params.push(hashedPassword)
    }
    if (role) {
      updateFields.push("role = ?")
      params.push(role)
    }
    if (status) {
      updateFields.push("status = ?")
      params.push(status)
    }
    if (licenseStartDate) {
      updateFields.push("license_start_date = ?")
      params.push(licenseStartDate)
    }
    if (licenseEndDate) {
      updateFields.push("license_end_date = ?")
      params.push(licenseEndDate)
    }
    if (maxUsers !== undefined) {
      updateFields.push("max_users = ?")
      params.push(maxUsers)
    }
    if (maxCounters !== undefined) {
      updateFields.push("max_counters = ?")
      params.push(maxCounters)
    }

    // Update admin table if there are fields to update
    if (updateFields.length > 0) {
      const updateQuery = `UPDATE admin SET ${updateFields.join(", ")} WHERE id = ?`
      params.push(adminId)
      await connection.query(updateQuery, params)
    }

    // Update permissions if provided
    if (permissions) {
      const {
        manage_users,
        manage_services,
        view_reports,
        manage_configuration
      } = permissions

      // Check if permissions record exists
      const [existingPerms] = await connection.query(
        "SELECT id FROM admin_permissions WHERE admin_id = ?",
        [adminId]
      )

      if (existingPerms.length > 0) {
        // Update existing permissions
        let permFields = []
        let permParams = []

        if (manage_users !== undefined) {
          permFields.push("manage_users = ?")
          permParams.push(manage_users)
        }
        if (manage_services !== undefined) {
          permFields.push("manage_services = ?")
          permParams.push(manage_services)
        }
        if (view_reports !== undefined) {
          permFields.push("view_reports = ?")
          permParams.push(view_reports)
        }
        if (manage_configuration !== undefined) {
          permFields.push("manage_configuration = ?")
          permParams.push(manage_configuration)
        }

        if (permFields.length > 0) {
          const permQuery = `UPDATE admin_permissions SET ${permFields.join(", ")} WHERE admin_id = ?`
          permParams.push(adminId)
          await connection.query(permQuery, permParams)
        }
      } else {
        // Insert new permissions record
        await connection.query(
          `INSERT INTO admin_permissions (
            admin_id, manage_users, manage_services, view_reports, manage_configuration
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            adminId, 
            manage_users || false, 
            manage_services || false, 
            view_reports || false, 
            manage_configuration || false
          ]
        )
      }
    }

    await connection.commit()

    res.json({ success: true, message: "Admin updated successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Update admin error:", error)
    res.status(500).json({ 
      success: false, 
      message: "Failed to update admin" 
    })
  } finally {
    connection.release()
  }
}
