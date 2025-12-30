import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pool from '../config/database.js';
import { authenticateToken, authorize } from '../middlewares/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/backups');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `backup-${uniqueSuffix}.sql`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Only SQL files are allowed'));
    }
  }
});

// Create SQL backup for an admin
router.post('/create/:adminId', authenticateToken, authorize('super_admin'), async (req, res) => {
  const { adminId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let sqlContent = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // SQL Header
    sqlContent += `-- =============================================\n`;
    sqlContent += `-- Queue Management System - Admin Backup\n`;
    sqlContent += `-- Admin ID: ${adminId}\n`;
    sqlContent += `-- Backup Date: ${new Date().toLocaleString()}\n`;
    sqlContent += `-- =============================================\n\n`;
    sqlContent += `SET SQL_MODE = 'NO_ENGINE_SUBSTITUTION';\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // Tables to backup with admin_id column
    const tables = [
      'services',
      'tickets',
      'sessions',
      // 'button_settings',  // Global settings, no admin_id
      // 'voice_settings',   // Global settings, no admin_id
      // 'counter_display_settings', // Table doesn't exist in database
      'display_screen_sessions',
      'activity_logs'
    ];
    
    // Tables without admin_id (backup all rows)
    const globalTables = [
      'button_settings',
      'voice_settings'
    ];

    let totalRows = 0;

    // Backup tables with admin_id
    for (const table of tables) {
      try {
        const [rows] = await connection.query(
          `SELECT * FROM ${table} WHERE admin_id = ?`,
          [adminId]
        );

        if (rows.length > 0) {
          sqlContent += `-- =============================================\n`;
          sqlContent += `-- Table: ${table}\n`;
          sqlContent += `-- Rows: ${rows.length}\n`;
          sqlContent += `-- =============================================\n\n`;

          // NOTE: We are NOT deleting existing data, only adding new backup data
          // sqlContent += `DELETE FROM ${table} WHERE admin_id = ${adminId};\n\n`;

          // Generate INSERT statements (skip ID to avoid duplicates - let auto-increment handle it)
          for (const row of rows) {
            // Exclude 'id' column to avoid primary key conflicts
            const columns = Object.keys(row).filter(col => col !== 'id');
            
            const values = columns.map(col => {
              const value = row[col];
              if (value === null || value === undefined) return 'NULL';
              if (typeof value === 'string') {
                // Handle invalid datetime values
                if (value === '0000-00-00' || value === '0000-00-00 00:00:00') {
                  return 'NULL';
                }
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (value instanceof Date) {
                const dateStr = value.toISOString().slice(0, 19).replace('T', ' ');
                // Check if it's an invalid date
                if (dateStr.startsWith('0000') || dateStr.includes('Invalid')) {
                  return 'NULL';
                }
                return `'${dateStr}'`;
              }
              if (typeof value === 'boolean') {
                return value ? '1' : '0';
              }
              return value;
            }).join(', ');

            sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
          }
          
          sqlContent += `\n`;
          totalRows += rows.length;
          console.log(`✅ Backed up ${rows.length} rows from ${table}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not backup table ${table}:`, error.message);
      }
    }
    
    // Backup global tables (without admin_id filter)
    for (const table of globalTables) {
      try {
        const [rows] = await connection.query(`SELECT * FROM ${table}`);

        if (rows.length > 0) {
          sqlContent += `-- =============================================\n`;
          sqlContent += `-- Table: ${table} (Global Settings)\n`;
          sqlContent += `-- Rows: ${rows.length}\n`;
          sqlContent += `-- =============================================\n\n`;

          // Generate INSERT statements (skip ID to avoid duplicates)
          for (const row of rows) {
            const columns = Object.keys(row).filter(col => col !== 'id');
            
            const values = columns.map(col => {
              const value = row[col];
              if (value === null || value === undefined) return 'NULL';
              if (typeof value === 'string') {
                if (value === '0000-00-00' || value === '0000-00-00 00:00:00') {
                  return 'NULL';
                }
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (value instanceof Date) {
                const dateStr = value.toISOString().slice(0, 19).replace('T', ' ');
                if (dateStr.startsWith('0000') || dateStr.includes('Invalid')) {
                  return 'NULL';
                }
                return `'${dateStr}'`;
              }
              if (typeof value === 'boolean') {
                return value ? '1' : '0';
              }
              return value;
            }).join(', ');

            sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
          }
          
          sqlContent += `\n`;
          totalRows += rows.length;
          console.log(`✅ Backed up ${rows.length} rows from ${table} (global)`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not backup global table ${table}:`, error.message);
      }
    }

    sqlContent += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlContent += `SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';\n`;
    sqlContent += `\n-- =============================================\n`;
    sqlContent += `-- Backup Complete\n`;
    sqlContent += `-- Total Rows: ${totalRows}\n`;
    sqlContent += `-- =============================================\n`;

    // Save backup file
    const backupFileName = `backup_admin_${adminId}_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../uploads/backups', backupFileName);
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, '../uploads/backups'), { recursive: true });
    await fs.writeFile(backupPath, sqlContent, 'utf8');

    // Log backup creation
    try {
      await connection.query(
        'INSERT INTO activity_logs (admin_id, description, performed_by) VALUES (?, ?, ?)',
        [adminId, `[BACKUP_CREATED] SQL Backup created for admin ID ${adminId} (${totalRows} rows)`, req.user.id]
      );
    } catch (error) {
      console.warn('Could not log backup creation:', error.message);
    }

    await connection.commit();

    // Send file for download
    res.download(backupPath, backupFileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Delete file after sending
      fs.unlink(backupPath).catch(e => console.warn('Could not delete temp file:', e.message));
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Restore SQL backup for an admin
router.post('/restore', authenticateToken, authorize('super_admin'), upload.single('backupFile'), async (req, res) => {
  const { adminId } = req.body;
  const connection = await pool.getConnection();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No backup file provided'
      });
    }

    // Read SQL file
    const sqlContent = await fs.readFile(req.file.path, 'utf8');

    // Verify admin ID in SQL file
    const adminIdMatch = sqlContent.match(/-- Admin ID: (\d+)/);
    if (adminIdMatch && adminIdMatch[1] != adminId) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: `Backup file is for Admin ID ${adminIdMatch[1]}, but you selected Admin ID ${adminId}`
      });
    }

    await connection.beginTransaction();

    // Set SQL mode to allow invalid dates during restore
    await connection.query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");

    // Split SQL content by semicolons, but be careful with multi-line statements
    const statements = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.startsWith('SET');
      })
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let executedCount = 0;
    let deletedCount = 0;
    let insertedCount = 0;

    // Table name mapping for old backup files
    const tableMapping = {
      'counter_display': 'counter_display_settings'
    };
    
    // Tables that don't have admin_id column
    const tablesWithoutAdminId = [
      'admin', 
      'users', 
      'super_admin',
      'admin_btn_settings',
      'button_settings',    // Global settings table
      'voice_settings',     // Global settings table
      'all_counters',       // Counter logs table
      'ticket_counters',    // Ticket counter state table
      'user_services'       // User-service mapping table
    ];

    for (const statement of statements) {
      try {
        // Skip DELETE statements - we don't want to delete existing data
        if (statement.toUpperCase().includes('DELETE FROM')) {
          console.log(`⚠️  Skipping DELETE statement (preserving existing data)`);
          continue;
        }
        
        if (statement.toUpperCase().includes('INSERT INTO')) {
          try {
            // Fix table names for old backup files
            let fixedStatement = statement;
            for (const [oldName, newName] of Object.entries(tableMapping)) {
              const regex = new RegExp(`INSERT INTO \\\`?${oldName}\\\`?`, 'gi');
              fixedStatement = fixedStatement.replace(regex, `INSERT INTO \`${newName}\``);
            }
            
            // Inject admin_id into INSERT statement (only for tables that have admin_id column)
            // Pattern: INSERT INTO table_name (col1, col2, ...) VALUES (val1, val2, ...), (val3, val4, ...)
            const insertMatch = fixedStatement.match(/INSERT INTO\s+`?(\w+)`?\s*\((.*?)\)\s*VALUES\s*(.*)/is);
            
            if (insertMatch) {
              const tableName = insertMatch[1];
              const columns = insertMatch[2].trim();
              const valuesSection = insertMatch[3].trim();
              
              // Check if this table should have admin_id and if it's not already present
              const shouldInjectAdminId = !tablesWithoutAdminId.includes(tableName.toLowerCase()) 
                                         && !columns.toLowerCase().includes('admin_id');
              
              if (shouldInjectAdminId) {
                // Add admin_id to columns
                const newColumns = columns ? `admin_id, ${columns}` : 'admin_id';
                
                // Add admin_id to each value tuple
                // Match all value tuples: (val1, val2), (val3, val4), etc.
                const newValuesSection = valuesSection.replace(/\(([^)]+)\)/g, (match, values) => {
                  return `(${adminId}, ${values})`;
                });
                
                fixedStatement = `INSERT INTO \`${tableName}\` (${newColumns}) VALUES ${newValuesSection}`;
                console.log(`📝 Injected admin_id=${adminId} into ${tableName}`);
              }
            }
            
            await connection.query(fixedStatement);
            // Count number of VALUE rows
            const valueMatches = statement.match(/\),\s*\(/g);
            const rowCount = valueMatches ? valueMatches.length + 1 : 1;
            insertedCount += rowCount;
            console.log(`✅ Inserted ${rowCount} rows (existing data preserved)`);
          } catch (insertError) {
            // If duplicate entry, skip and continue (data already exists)
            if (insertError.code === 'ER_DUP_ENTRY') {
              console.log(`⚠️  Skipping duplicate entry (data already exists)`);
              // Don't throw error, just continue
            } else if (insertError.code === 'ER_NO_SUCH_TABLE') {
              console.log(`⚠️  Skipping non-existent table (table not in current schema)`);
              // Don't throw error, just continue
            } else {
              // For other errors, throw
              throw insertError;
            }
          }
        }
        executedCount++;
      } catch (error) {
        console.error(`❌ Error executing statement:`, error.message);
        console.error(`Statement preview:`, statement.substring(0, 200));
        throw error;
      }
    }

    // Reset SQL mode back to strict
    await connection.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");

    // Log backup restoration
    try {
      await connection.query(
        'INSERT INTO activity_logs (admin_id, description, performed_by) VALUES (?, ?, ?)',
        [adminId, `[BACKUP_RESTORED] SQL Backup restored for admin ID ${adminId} (${insertedCount} inserts, ${deletedCount} deletes)`, req.user.id]
      );
    } catch (error) {
      console.warn('Could not log backup restoration:', error.message);
    }

    await connection.commit();

    // Delete uploaded file after processing
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.warn('Could not delete temporary file:', error.message);
    }

    res.json({
      success: true,
      message: 'SQL Backup restored successfully (existing data preserved)',
      restored: {
        statements_executed: executedCount,
        rows_inserted: insertedCount
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error restoring backup:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Could not delete temporary file:', unlinkError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to restore SQL backup',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get backup history for an admin
router.get('/history/:adminId', authenticateToken, authorize('super_admin'), async (req, res) => {
  const { adminId } = req.params;

  try {
    // Simple query - return empty array if table doesn't exist or has issues
    let logs = [];
    
    try {
      const [result] = await pool.query(
        `SELECT description, created_at, 'success' as status,
         CASE 
           WHEN description LIKE '%BACKUP_CREATED%' THEN 'BACKUP_CREATED'
           WHEN description LIKE '%BACKUP_RESTORED%' THEN 'BACKUP_RESTORED'
           ELSE 'BACKUP_ACTION'
         END as type
         FROM activity_logs 
         WHERE admin_id = ? AND (
           description LIKE '%BACKUP_CREATED%' OR 
           description LIKE '%BACKUP_RESTORED%'
         )
         ORDER BY created_at DESC
         LIMIT 50`,
        [adminId]
      );
      logs = result || [];
    } catch (queryError) {
      console.warn('Could not fetch activity logs:', queryError.message);
      // Return empty array instead of error
      logs = [];
    }

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Error fetching backup history:', error);
    // Still return success with empty array instead of 500 error
    res.json({
      success: true,
      data: [],
      message: 'No backup history available'
    });
  }
});

export default router;
