#!/usr/bin/env node

/**
 * Backend Server Test Script
 * Tests all controller imports and database connection
 */

import pool from './config/database.js'

console.log('🧪 Testing Backend Structure...\n')

// Test 1: Database Connection
console.log('1️⃣ Testing database connection...')
try {
  const connection = await pool.getConnection()
  console.log('   ✅ Database connected successfully')
  connection.release()
} catch (err) {
  console.log('   ❌ Database connection failed:', err.message)
}

// Test 2: Controller Imports
console.log('\n2️⃣ Testing controller imports...')
try {
  // Auth controllers
  const auth = await import('./controllers/auth/index.js')
  console.log('   ✅ Auth controllers:', Object.keys(auth).length, 'functions')
  
  // Admin controllers
  const admin = await import('./controllers/admin/index.js')
  console.log('   ✅ Admin controllers:', Object.keys(admin).length, 'functions')
  
  // Ticket controllers
  const tickets = await import('./controllers/tickets/index.js')
  console.log('   ✅ Ticket controllers:', Object.keys(tickets).length, 'functions')
  
  // User controllers
  const user = await import('./controllers/user/index.js')
  console.log('   ✅ User controllers:', Object.keys(user).length, 'functions')
  
  // License controllers
  const license = await import('./controllers/license/index.js')
  console.log('   ✅ License controllers:', Object.keys(license).length, 'functions')
  
} catch (err) {
  console.log('   ❌ Controller import failed:', err.message)
}

// Test 3: Routes
console.log('\n3️⃣ Testing route imports...')
try {
  await import('./routes/auth.js')
  console.log('   ✅ Auth routes')
  
  await import('./routes/admin.js')
  console.log('   ✅ Admin routes')
  
  await import('./routes/tickets.js')
  console.log('   ✅ Ticket routes')
  
  await import('./routes/user.js')
  console.log('   ✅ User routes')
  
  await import('./routes/license.js')
  console.log('   ✅ License routes')
  
} catch (err) {
  console.log('   ❌ Route import failed:', err.message)
}

// Test 4: Check admin table structure
console.log('\n4️⃣ Checking admin table structure...')
try {
  const [columns] = await pool.query("SHOW COLUMNS FROM admin")
  const columnNames = columns.map(col => col.Field)
  console.log('   ✅ Admin table columns:', columnNames.join(', '))
  
  if (columnNames.includes('role')) {
    console.log('   ✅ Role column exists')
  } else {
    console.log('   ⚠️  Role column missing - needs to be added')
  }
} catch (err) {
  console.log('   ❌ Table check failed:', err.message)
}

console.log('\n✨ Test complete!\n')
process.exit(0)
