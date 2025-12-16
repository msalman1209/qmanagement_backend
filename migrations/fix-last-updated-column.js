import pool from "../config/database.js";

const fixLastUpdatedColumn = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if last_updated column exists
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'last_updated'"
    );

    if (columns.length > 0) {
      // Column exists, check if it has DEFAULT or ON UPDATE
      const column = columns[0];
      console.log('Current last_updated column:', column);
      
      // Modify the column to remove auto-update
      // We'll manually set this in our code instead
      await connection.query(
        "ALTER TABLE tickets MODIFY COLUMN last_updated DATETIME DEFAULT NULL"
      );
      console.log("✓ Modified last_updated column to remove auto-update");
    }

    // Also check for updated_at column
    const [updatedAtColumns] = await connection.query(
      "SELECT COLUMN_NAME, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'updated_at'"
    );

    if (updatedAtColumns.length > 0) {
      const column = updatedAtColumns[0];
      console.log('Current updated_at column:', column);
      
      await connection.query(
        "ALTER TABLE tickets MODIFY COLUMN updated_at DATETIME DEFAULT NULL"
      );
      console.log("✓ Modified updated_at column to remove auto-update");
    }

    connection.release();
    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("Error in migration:", error);
    // It's okay if column doesn't exist
    if (error.code !== 'ER_BAD_FIELD_ERROR') {
      throw error;
    }
  }
};

fixLastUpdatedColumn().then(() => {
  console.log("✓ Column fix completed");
  process.exit(0);
}).catch(err => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
