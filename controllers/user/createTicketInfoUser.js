import pool from "../../config/database.js";
import bcryptjs from "bcryptjs";

export const createTicketInfoUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, email, password, admin_id } = req.body;

    console.log('📝 Creating Ticket Info User:', { username, email, admin_id });

    // Validate required fields
    if (!username || !email || !password || !admin_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: username, email, password, admin_id"
      });
    }

    // Validate password length
    if (password.length < 6) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Get license information for the admin
    const [licenses] = await connection.query(
      "SELECT max_ticket_info_users FROM licenses WHERE admin_id = ? AND status = 'active'",
      [admin_id]
    );

    if (licenses.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "No active license found for this admin. Please contact tech support."
      });
    }

    const maxTicketInfoUsers = licenses[0].max_ticket_info_users || 3;

    // Check current count of ticket_info users
    const [currentUsers] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE admin_id = ? AND role = 'ticket_info'",
      [admin_id]
    );

    if (currentUsers[0].count >= maxTicketInfoUsers) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Maximum ticket info users limit reached (${maxTicketInfoUsers}/${maxTicketInfoUsers}). Please contact tech support to upgrade your license.`
      });
    }

    // Check if email already exists (globally unique)
    const [existingEmail] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // ✅ Check if username already exists GLOBALLY (not just per admin)
    // This ensures username is unique across entire system
    const [existingUsername] = await connection.query(
      "SELECT id, username, admin_id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Username "${username}" already exists. Please choose a different username.`
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const [result] = await connection.query(
      `INSERT INTO users (
        username, email, password, role, admin_id, status, created_at
      ) VALUES (?, ?, ?, 'ticket_info', ?, 'active', NOW())`,
      [username, email, hashedPassword, admin_id]
    );

    await connection.commit();

    console.log('✅ Ticket Info User Created:', result.insertId);

    res.status(201).json({
      success: true,
      message: "Ticket info user created successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role: 'ticket_info',
        admin_id
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Create ticket info user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket info user",
      error: error.message
    });
  } finally {
    connection.release();
  }
};
