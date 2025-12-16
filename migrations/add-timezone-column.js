import pool from "../config/database.js";

const addTimezoneColumn = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if timezone column exists
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin' AND COLUMN_NAME = 'timezone'"
    );

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await connection.query(
        "ALTER TABLE admin ADD COLUMN timezone VARCHAR(10) DEFAULT '+05:00' AFTER status"
      );
      console.log("✓ timezone column added to admin table");
    } else {
      console.log("✓ timezone column already exists");
    }

    connection.release();
  } catch (error) {
    console.error("Error adding timezone column:", error);
    process.exit(1);
  }
};

addTimezoneColumn().then(() => {
  console.log("Migration completed successfully");
  process.exit(0);
});
