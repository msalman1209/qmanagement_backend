# 🚀 Automatic Database Setup System

## Overview (خودکار ڈیٹا بیس سیٹ اپ سسٹم)

Yeh system automatically server start hone par **sare database tables create kar deta hai**. Ab aapko manually migrations run karne ki zaroorat nahi!

## ✨ Features

### 🔄 Auto-Setup on Server Start
- Server start hone par automatically `COMPLETE_SCHEMA.sql` read hota hai
- Sare tables automatically create ho jate hain
- Agar table pehle se exist kare to skip kar dete hain
- Super admin account automatically create hota hai

### 📦 Included Tables (Complete List)

1. **admin** - Super admin aur admin users
2. **admin_sessions** - Admin login sessions tracking
3. **licenses** - License management with limits
4. **voice_settings** - Voice/TTS configuration per admin
5. **users** - Regular users, receptionists, ticket_info users
6. **user_sessions** - User login sessions
7. **services** - Services/queues configuration
8. **user_services** - User to service assignments
9. **tickets** - Ticket/queue management
10. **ticket_counters** - Ticket number sequences
11. **Counters** - Counter stations
12. **all_counters** - Counter activity history
13. **counter_display** - Display configuration
14. **admin_btn_settings** - Button visibility settings
15. **services_display** - Service screen auth
16. **tickets_display** - Ticket screen auth
17. **display_sessions** - Display screen sessions
18. **tickets_sessions** - Ticket screen sessions
19. **services_time_restrictions** - Time-based restrictions

### 🔑 Migration Columns (Ab Direct Tables Main Hain)

**Users Table:**
- ✅ `admin_id` - Admin ownership
- ✅ `status` - User status
- ✅ `role` - user/receptionist/ticket_info
- ✅ `isLoggedIn` - Login tracking
- ✅ `lastLogin` - Last login time
- ✅ `sessionExpiry` - Session expiration

**Licenses Table:**
- ✅ `max_receptionists` - Receptionist limit
- ✅ `max_ticket_info_users` - Ticket info user limit
- ✅ `max_sessions_per_receptionist` - Session limit per receptionist
- ✅ `max_sessions_per_ticket_info` - Session limit per ticket info
- ✅ `admin_sections` - Admin accessible sections

**Voice Settings Table:**
- ✅ `admin_id` - Admin ownership
- ✅ `languages` - Multi-language support (JSON array)

**Tickets Table:**
- ✅ `called_at` - When ticket was called
- ✅ `called_by_user_id` - User who called ticket

**Counter Display Table:**
- ✅ `admin_id` - Admin ownership

## 🚀 How It Works (کیسے کام کرتا ہے)

### Step 1: Database Configuration
`.env` file mein database credentials set karen:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u998585094_demoqueue
DB_PORT=3306
```

### Step 2: Start Server
Simply server start karen:

```bash
node server.js
```

### Step 3: Automatic Setup
Server automatically:
1. ✅ Database connection check karega
2. ✅ `COMPLETE_SCHEMA.sql` read karega
3. ✅ Sare tables create karega (jo exist nahi karte)
4. ✅ Sample data insert karega
5. ✅ Super admin account create karega
6. ✅ Verification karega ke sab kuch ready hai

### Console Output Example:

```
============================================================
🚀 QUEUE MANAGEMENT SYSTEM - DATABASE INITIALIZATION
============================================================

🔌 Checking database connection...
✅ Database connection successful!

🔧 Starting automatic database setup...

📄 Found 50 SQL statements to execute

📦 Creating table: admin...
✅ Table 'admin' created successfully
📦 Creating table: admin_sessions...
✅ Table 'admin_sessions' created successfully
📦 Creating table: licenses...
✅ Table 'licenses' created successfully
...

============================================================
✨ Database Setup Summary:
============================================================
✅ Successfully created/updated: 20
⏭️  Skipped (already exists):    5
❌ Errors:                       0
============================================================

🔍 Verifying critical tables...

✅ admin                - EXISTS
✅ admin_sessions       - EXISTS
✅ licenses             - EXISTS
✅ users                - EXISTS
✅ voice_settings       - EXISTS
...

✅ Database setup completed!

👤 Checking super admin account...
✅ Super admin account already exists.

✨ Database setup completed successfully!

🚀 Server is running on port 5000
📡 Health check: http://localhost:5000/api/health
```

## 📁 File Structure

```
backend/
├── database/
│   ├── COMPLETE_SCHEMA.sql      ← Complete schema with all migrations
│   ├── auto-setup.js            ← Auto-setup logic
│   └── schema.sql               ← Updated schema (legacy)
├── server.js                    ← Server with auto-setup integration
└── .env                         ← Database credentials
```

## 🎯 Benefits (فوائد)

### 1. **Zero Manual Migration** ❌ ➡️ ✅
- Ab alag se migration files run karne ki zaroorat nahi
- Sab kuch automatically ho jata hai

### 2. **Single Source of Truth** 📄
- `COMPLETE_SCHEMA.sql` - Sab kuch ek jagah
- Koi confusion nahi ke kaunse columns add hue

### 3. **Safe & Smart** 🛡️
- Existing tables ko skip karta hai
- Duplicate data nahi dalega
- Error handling properly hai

### 4. **Development Friendly** 👨‍💻
- Naya developer easily setup kar sakta hai
- Fresh database ek command se ready

### 5. **Production Ready** 🚀
- Server restart par bhi safe
- Idempotent operations (multiple times run safe)

## ⚠️ Important Notes

1. **First Time Setup**: Pehli baar jab run karenge to sare tables create honge
2. **Subsequent Starts**: Agali baar se jo tables exist karenge wo skip honge
3. **Super Admin**: Default credentials:
   - Email: `superadmin@example.com`
   - Password: `superadmin@123`
4. **Safe to Run**: Multiple times run karne par bhi safe hai

## 🔧 Troubleshooting

### Problem: Database Connection Failed
**Solution**: `.env` file check karen, credentials sahi hone chahiye

### Problem: Tables Not Creating
**Solution**: 
1. Database user ko CREATE permission hona chahiye
2. Database already exist hona chahiye
3. COMPLETE_SCHEMA.sql file path check karen

### Problem: Duplicate Entry Errors
**Solution**: Yeh normal hai, already existing data ko skip kar raha hai

## 📝 Manual Reset (If Needed)

Agar aap fresh start chahte hain:

```sql
-- Drop all tables (CAUTION: All data will be lost!)
DROP DATABASE u998585094_demoqueue;
CREATE DATABASE u998585094_demoqueue;
```

Phir server restart karen, sab kuch fresh create ho jayega.

## 🎉 Summary

Ab aapko sirf **`node server.js`** run karna hai aur:
- ✅ Sare tables automatically create honge
- ✅ Migration columns automatically add honge
- ✅ Super admin account ready hoga
- ✅ System use karne ke liye tayyar hoga

**No manual migrations, no hassle - Everything automatic!** 🚀
