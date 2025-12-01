import pool from "../config/database.js";

async function addTicketColumns() {
  const connection = await pool.getConnection();
  try {
    console.log('Adding counter_no and called_at columns to tickets table...');
    
    // Check if counter_no column exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM tickets LIKE 'counter_no'"
    );
    
    if (columns.length === 0) {
      await connection.query(
        "ALTER TABLE tickets ADD COLUMN counter_no INT(11) DEFAULT NULL AFTER status"
      );
      console.log('✅ counter_no column added');
    } else {
      console.log('✅ counter_no column already exists');
    }
    
    // Check if called_at column exists
    const [calledAtColumns] = await connection.query(
      "SHOW COLUMNS FROM tickets LIKE 'called_at'"
    );
    
    if (calledAtColumns.length === 0) {
      await connection.query(
        "ALTER TABLE tickets ADD COLUMN called_at DATETIME DEFAULT NULL AFTER counter_no"
      );
      console.log('✅ called_at column added');
    } else {
      console.log('✅ called_at column already exists');
    }
    
    console.log('✅ Ticket table updated successfully!');
  } catch (error) {
    console.error('❌ Error updating tickets table:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addTicketColumns();
