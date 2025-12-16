import pool from "../config/database.js";

const fixAllTimestampColumns = async () => {
  try {
    const connection = await pool.getConnection();
    
    console.log('Fixing all timestamp columns to use DATETIME without auto-update...');
    
    const columns = [
      { name: 'created_at', type: 'DATETIME DEFAULT NULL' },
      { name: 'status_time', type: 'DATETIME DEFAULT NULL' },
      { name: 'calling_user_time', type: 'DATETIME DEFAULT NULL' },
      { name: 'transfered_time', type: 'DATETIME DEFAULT NULL' },
    ];
    
    for (const col of columns) {
      try {
        await connection.query(
          `ALTER TABLE tickets MODIFY COLUMN ${col.name} ${col.type}`
        );
        console.log(`✓ Fixed ${col.name}`);
      } catch (error) {
        console.error(`✗ Error fixing ${col.name}:`, error.message);
      }
    }

    connection.release();
    console.log("✓ All timestamp columns fixed!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixAllTimestampColumns().then(() => {
  process.exit(0);
});
