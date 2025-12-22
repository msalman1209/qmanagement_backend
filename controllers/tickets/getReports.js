import pool from "../../config/database.js";

export const getReports = async (req, res) => {
  try {
    console.log('Reports request from user:', req.user);
    const { startDate, endDate, adminId } = req.query;
    console.log('Date filter - Start:', startDate, 'End:', endDate);
    console.log('Admin filter:', adminId);

    // Check if admin_id column exists in users table first
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'admin_id'");
    const hasAdminId = columns.length > 0;
    
    console.log('admin_id column exists:', hasAdminId);

    // Build the query based on user role
    let query = `
      SELECT 
        u.username,
        u.id as user_id,
        (
          SELECT COUNT(*)
          FROM tickets t1
          WHERE t1.caller = u.username
          ${startDate && endDate ? 'AND DATE(t1.date) BETWEEN ? AND ?' : ''}
        ) as total,
        (
          SELECT COUNT(*)
          FROM tickets t2
          WHERE t2.caller = u.username
          AND (LOWER(TRIM(t2.status)) = 'solved' OR TRIM(t2.status) = 'Solved')
          ${startDate && endDate ? 'AND DATE(t2.date) BETWEEN ? AND ?' : ''}
        ) as total_solved,
        (
          SELECT COUNT(*)
          FROM tickets t3
          WHERE t3.caller = u.username
          AND (LOWER(TRIM(t3.status)) = 'not solved' OR TRIM(t3.status) = 'Not Solved')
          ${startDate && endDate ? 'AND DATE(t3.date) BETWEEN ? AND ?' : ''}
        ) as not_solved,
        (
          SELECT COUNT(*)
          FROM tickets t4
          WHERE t4.caller = u.username
          AND (LOWER(TRIM(t4.status)) = 'Unattended' OR TRIM(t4.status) = 'Unattended' OR TRIM(t4.status) = 'unattendant' OR TRIM(t4.status) = 'Unattendant' OR LOWER(TRIM(t4.status)) = 'pending' OR TRIM(t4.status) = 'Pending')
          ${startDate && endDate ? 'AND DATE(t4.date) BETWEEN ? AND ?' : ''}
        ) as unattended_tickets,
        (
          SELECT COUNT(*)
          FROM tickets t5
          WHERE t5.transfer_by = u.username
          ${startDate && endDate ? 'AND DATE(t5.date) BETWEEN ? AND ?' : ''}
        ) as transferred
      FROM users u
      WHERE u.role = 'user'
    `;

    const queryParams = [];

    // Add date params for each CASE statement
    if (startDate && endDate) {
      // For total count
      queryParams.push(startDate, endDate);
      // For total_solved
      queryParams.push(startDate, endDate);
      // For not_solved
      queryParams.push(startDate, endDate);
      // For unattended_tickets
      queryParams.push(startDate, endDate);
      // For transferred
      queryParams.push(startDate, endDate);
    }

    // Add admin filtering if column exists
    if (hasAdminId) {
      if (req.user && req.user.role === 'admin') {
        // For admin users, use their admin_id (or id if they ARE the admin)
        const effectiveAdminId = req.user.admin_id || req.user.id;
        query += ' AND u.admin_id = ? ';
        queryParams.push(effectiveAdminId);
        console.log('Admin filter - Using admin_id:', effectiveAdminId);
      } else if (adminId && req.user && req.user.role === 'super_admin') {
        query += ' AND u.admin_id = ? ';
        queryParams.push(adminId);
        console.log('Super admin filter - Using provided adminId:', adminId);
      } else if (req.user && req.user.admin_id) {
        // For any other role with admin_id (like user, receptionist)
        query += ' AND u.admin_id = ? ';
        queryParams.push(req.user.admin_id);
        console.log('User filter - Using admin_id:', req.user.admin_id);
      }
    }

    query += ' ORDER BY u.username';

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    const [reports] = await pool.query(query, queryParams);
    console.log('Query returned', reports.length, 'reports');
    if (reports.length > 0) {
      console.log('Sample report data:', reports[0]);
    }

    // Format the response
    const formattedReports = reports.map(report => {
      const totalSolved = Number(report.total_solved) || 0;
      const notSolved = Number(report.not_solved) || 0;
      const unattendedTickets = Number(report.unattended_tickets) || 0;
      const transferred = Number(report.transferred) || 0;
      
      // Calculate total as sum of all categories
      const total = totalSolved + notSolved + unattendedTickets + transferred;
      
      return {
        user: report.username,
        userId: report.user_id,
        totalSolved,
        notSolved,
        unattendedTickets,
        transferred,
        total, // Sum of all categories
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time'
      };
    });

    res.status(200).json({
      success: true,
      data: formattedReports,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
      error: error.message
    });
  }
};
