import pool from "./config/database.js";

const checkTimeColumns = async () => {
  try {
    const conn = await pool.getConnection();
    
    const [cols] = await conn.query(
      `SHOW COLUMNS FROM tickets WHERE Field LIKE '%time%' OR Field LIKE '%created%'`
    );
    
    console.log('Time-related columns in tickets table:');
    cols.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null})`);
    });
    
    conn.release();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
};

checkTimeColumns();
