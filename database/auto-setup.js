import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automatically sets up database schema on server startup
 * Reads COMPLETE_SCHEMA.sql and executes all table definitions
 */
async function autoSetupDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔧 Starting automatic database setup...\n');
    
    // Read the HOSTINGER BACKUP file (priority)
    const backupPath = path.join(__dirname, 'HOSTINGER_BACKUP.sql');
    const schemaPath = path.join(__dirname, 'COMPLETE_SCHEMA.sql');
    
    let sqlFilePath = schemaPath;
    if (fs.existsSync(backupPath)) {
      console.log('📦 Using HOSTINGER_BACKUP.sql (exact production copy)\n');
      sqlFilePath = backupPath;
    } else {
      console.log('📦 Using COMPLETE_SCHEMA.sql\n');
    }
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found!');
      return false;
    }
    
    const schemaSQL = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Remove comments and clean SQL
    let cleanSQL = schemaSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('/*') &&
               !trimmed.startsWith('*/') &&
               !trimmed.startsWith('*');
      })
      .join('\n');
    
    // Remove MySQL specific commands
    cleanSQL = cleanSQL.replace(/\/\*!.*?\*\//gs, '');
    cleanSQL = cleanSQL.replace(/SET .*?;/gi, '');
    cleanSQL = cleanSQL.replace(/START TRANSACTION;?/gi, '');
    cleanSQL = cleanSQL.replace(/COMMIT;?/gi, '');
    
    // Split SQL into individual statements (handle multi-line CREATE statements)
    const statements = [];
    let currentStatement = '';
    let inCreateTable = false;
    
    const lines = cleanSQL.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if CREATE TABLE starts
      if (trimmed.toUpperCase().includes('CREATE TABLE')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = line + '\n';
        inCreateTable = true;
      } 
      // Check if CREATE TABLE ends
      else if (inCreateTable && trimmed.includes(') ENGINE=')) {
        currentStatement += line + ';';
        statements.push(currentStatement.trim());
        currentStatement = '';
        inCreateTable = false;
      }
      // Continue building current statement
      else if (inCreateTable) {
        currentStatement += line + '\n';
      }
      // Handle INSERT statements
      else if (trimmed.toUpperCase().startsWith('INSERT INTO')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = line;
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      // Continue INSERT statement
      else if (currentStatement.trim().toUpperCase().startsWith('INSERT')) {
        currentStatement += '\n' + line;
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      // Handle ALTER statements
      else if (trimmed.toUpperCase().startsWith('ALTER TABLE')) {
        currentStatement = line;
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      // Continue ALTER statement
      else if (currentStatement.trim().toUpperCase().startsWith('ALTER')) {
        currentStatement += '\n' + line;
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
    
    // Add last statement if exists
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter valid statements
    const validStatements = statements.filter(stmt => {
      const upper = stmt.toUpperCase();
      return upper.includes('CREATE TABLE') || 
             upper.includes('INSERT INTO') || 
             upper.includes('ALTER TABLE');
    });
    
    console.log(`📄 Found ${validStatements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i].trim();
      
      if (!statement) continue;
      
      try {
        // Check if it's a CREATE TABLE statement
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE\s+`?(\w+)`?/i);
          const tableName = tableMatch ? tableMatch[1] : 'unknown';
          
          // Check if table already exists
          const [tables] = await connection.query(
            `SHOW TABLES LIKE '${tableName}'`
          );
          
          if (tables.length > 0) {
            console.log(`⏭️  Table '${tableName}' already exists - skipping`);
            skipCount++;
            continue;
          }
          
          console.log(`📦 Creating table: ${tableName}...`);
          await connection.query(statement);
          console.log(`✅ Table '${tableName}' created successfully`);
          successCount++;
        }
        // Skip INSERT statements (don't insert backup data)
        else if (statement.toUpperCase().includes('INSERT INTO')) {
          const tableMatch = statement.match(/INSERT INTO\s+`?(\w+)`?/i);
          const tableName = tableMatch ? tableMatch[1] : 'unknown';
          console.log(`⏭️  Skipping data insert for '${tableName}' (backup data preserved)`);
          skipCount++;
        }
        // Handle ALTER TABLE statements (for constraints/indexes)
        else if (statement.toUpperCase().includes('ALTER TABLE')) {
          try {
            await connection.query(statement);
            successCount++;
          } catch (alterError) {
            // Duplicate key/constraint is okay
            if (alterError.code === 'ER_DUP_KEYNAME' || 
                alterError.code === 'ER_DUP_ENTRY' ||
                alterError.code === 'ER_FK_DUP_NAME') {
              skipCount++;
            } else {
              console.log(`⚠️  Warning on ALTER: ${alterError.message}`);
            }
          }
        }
        // Handle CREATE DATABASE
        else if (statement.toUpperCase().includes('CREATE DATABASE')) {
          console.log(`🗄️  Database creation statement found - skipping (database should exist)`);
          skipCount++;
        }
        // Handle USE DATABASE
        else if (statement.toUpperCase().includes('USE ')) {
          skipCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ Database Setup Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created/updated: ${successCount}`);
    console.log(`⏭️  Skipped (already exists):    ${skipCount}`);
    console.log(`❌ Errors:                       ${errorCount}`);
    console.log('='.repeat(60));
    
    // Verify critical tables exist
    console.log('\n🔍 Verifying critical tables...\n');
    
    const criticalTables = [
      'admin',
      'admin_sessions', 
      'licenses',
      'users',
      'user_sessions',
      'voice_settings',
      'services',
      'tickets',
      'counter_display',
      'Counters'
    ];
    
    for (const tableName of criticalTables) {
      const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
      if (tables.length > 0) {
        console.log(`✅ ${tableName.padEnd(20)} - EXISTS`);
      } else {
        console.log(`❌ ${tableName.padEnd(20)} - MISSING`);
      }
    }
    
    console.log('\n✅ Database setup completed!\n');
    return true;
    
  } catch (error) {
    console.error('\n❌ Fatal error during database setup:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Check if database connection is working
 */
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Main setup function to be called on server startup
 */
export async function initializeDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 QUEUE MANAGEMENT SYSTEM - DATABASE INITIALIZATION');
  console.log('='.repeat(60) + '\n');
  
  // Check database connection first
  console.log('🔌 Checking database connection...');
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    console.error('\n❌ Cannot connect to database. Please check your .env configuration.\n');
    return false;
  }
  
  console.log('✅ Database connection successful!\n');
  
  // Run auto setup
  const setupSuccess = await autoSetupDatabase();
  
  if (setupSuccess) {
    console.log('🎉 Database is ready for use!\n');
  } else {
    console.error('⚠️  Database setup completed with warnings. Please review the logs.\n');
  }
  
  return setupSuccess;
}

export default initializeDatabase;
