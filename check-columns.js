import pool from "./config/database.js";

const checkColumns = async () => {
  try {
    const conn = await pool.getConnection();
    
    // Check all timestamp columns
    const fields = ['created_at', 'status_time', 'calling_user_time', 'transfered_time', 'last_updated'];
    
    for (const field of fields) {
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = ?`,
        [field]
      );
      
      if (cols.length > 0) {
        console.log(`✓ ${field}:`, cols[0].COLUMN_TYPE, 'EXTRA:', cols[0].EXTRA);
      } else {
        console.log(`✗ ${field}: NOT FOUND`);
      }
    }
    
    conn.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
};

checkColumns();
