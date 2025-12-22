-- Permission-Based Access Testing Script
-- Run these queries to test the permission system

-- ==========================================
-- 1. CHECK CURRENT USER PERMISSIONS
-- ==========================================

-- See all users with their permissions
SELECT 
  id,
  username,
  email,
  role,
  status,
  permissions
FROM users
ORDER BY id DESC
LIMIT 20;

-- ==========================================
-- 2. CREATE TEST USERS
-- ==========================================

-- Note: Replace 'ADMIN_ID_HERE' with actual admin ID from your system
-- You can get it by running: SELECT id FROM users WHERE role = 'admin' LIMIT 1;

-- Test User 1: Only Call Tickets Permission
INSERT INTO users (username, email, password, role, admin_id, status, permissions) 
VALUES (
  'test_caller',
  'caller@test.com',
  '$2b$10$YourHashedPasswordHere', -- You need to hash this properly
  'user',
  1, -- Replace with actual admin_id
  'active',
  JSON_OBJECT(
    'canCallTickets', true,
    'canCreateTickets', false,
    'canViewReports', false,
    'canManageQueue', false,
    'canAccessDashboard', false,
    'canManageUsers', false,
    'canManageTickets', false,
    'canManageSettings', false,
    'canManageCounters', false,
    'canManageServices', false
  )
);

-- Test User 2: Only Completed Tasks Permission
INSERT INTO users (username, email, password, role, admin_id, status, permissions) 
VALUES (
  'test_completer',
  'completer@test.com',
  '$2b$10$YourHashedPasswordHere', -- You need to hash this properly
  'user',
  1, -- Replace with actual admin_id
  'active',
  JSON_OBJECT(
    'canCallTickets', false,
    'canCreateTickets', true,
    'canViewReports', false,
    'canManageQueue', false,
    'canAccessDashboard', false,
    'canManageUsers', false,
    'canManageTickets', false,
    'canManageSettings', false,
    'canManageCounters', false,
    'canManageServices', false
  )
);

-- Test User 3: Both Permissions
INSERT INTO users (username, email, password, role, admin_id, status, permissions) 
VALUES (
  'test_both',
  'both@test.com',
  '$2b$10$YourHashedPasswordHere', -- You need to hash this properly
  'user',
  1, -- Replace with actual admin_id
  'active',
  JSON_OBJECT(
    'canCallTickets', true,
    'canCreateTickets', true,
    'canViewReports', false,
    'canManageQueue', false,
    'canAccessDashboard', false,
    'canManageUsers', false,
    'canManageTickets', false,
    'canManageSettings', false,
    'canManageCounters', false,
    'canManageServices', false
  )
);

-- ==========================================
-- 3. UPDATE EXISTING USER PERMISSIONS
-- ==========================================

-- Give user ONLY Call Tickets permission
UPDATE users 
SET permissions = JSON_OBJECT(
  'canCallTickets', true,
  'canCreateTickets', false,
  'canViewReports', false,
  'canManageQueue', false,
  'canAccessDashboard', false,
  'canManageUsers', false,
  'canManageTickets', false,
  'canManageSettings', false,
  'canManageCounters', false,
  'canManageServices', false
)
WHERE username = 'your_username_here';

-- Give user ONLY Completed Tasks permission
UPDATE users 
SET permissions = JSON_OBJECT(
  'canCallTickets', false,
  'canCreateTickets', true,
  'canViewReports', false,
  'canManageQueue', false,
  'canAccessDashboard', false,
  'canManageUsers', false,
  'canManageTickets', false,
  'canManageSettings', false,
  'canManageCounters', false,
  'canManageServices', false
)
WHERE username = 'your_username_here';

-- Give user BOTH permissions
UPDATE users 
SET permissions = JSON_OBJECT(
  'canCallTickets', true,
  'canCreateTickets', true,
  'canViewReports', false,
  'canManageQueue', false,
  'canAccessDashboard', false,
  'canManageUsers', false,
  'canManageTickets', false,
  'canManageSettings', false,
  'canManageCounters', false,
  'canManageServices', false
)
WHERE username = 'your_username_here';

-- ==========================================
-- 4. VERIFY PERMISSIONS
-- ==========================================

-- Check specific user's permissions
SELECT 
  id,
  username,
  email,
  role,
  JSON_EXTRACT(permissions, '$.canCallTickets') as can_call_tickets,
  JSON_EXTRACT(permissions, '$.canCreateTickets') as can_create_tickets,
  permissions
FROM users
WHERE username = 'your_username_here';

-- Find all users with Call Tickets permission
SELECT 
  id,
  username,
  email,
  role
FROM users
WHERE JSON_EXTRACT(permissions, '$.canCallTickets') = true;

-- Find all users with Completed Tasks permission
SELECT 
  id,
  username,
  email,
  role
FROM users
WHERE JSON_EXTRACT(permissions, '$.canCreateTickets') = true;

-- Find users with BOTH permissions
SELECT 
  id,
  username,
  email,
  role
FROM users
WHERE JSON_EXTRACT(permissions, '$.canCallTickets') = true
  AND JSON_EXTRACT(permissions, '$.canCreateTickets') = true;

-- Find users with NO permissions
SELECT 
  id,
  username,
  email,
  role
FROM users
WHERE JSON_EXTRACT(permissions, '$.canCallTickets') = false
  AND JSON_EXTRACT(permissions, '$.canCreateTickets') = false;

-- ==========================================
-- 5. CLEANUP (Delete Test Users)
-- ==========================================

-- Delete test users after testing
DELETE FROM users WHERE username IN ('test_caller', 'test_completer', 'test_both');

-- ==========================================
-- 6. DEBUGGING QUERIES
-- ==========================================

-- Check if permissions column exists
SHOW COLUMNS FROM users LIKE 'permissions';

-- Check data type of permissions column
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'permissions';

-- Find users with NULL or invalid permissions
SELECT 
  id,
  username,
  email,
  role,
  permissions
FROM users
WHERE permissions IS NULL 
   OR permissions = ''
   OR permissions = '{}';

-- Count users by permission type
SELECT 
  CASE 
    WHEN JSON_EXTRACT(permissions, '$.canCallTickets') = true 
     AND JSON_EXTRACT(permissions, '$.canCreateTickets') = true 
    THEN 'Both Permissions'
    WHEN JSON_EXTRACT(permissions, '$.canCallTickets') = true 
    THEN 'Only Call Tickets'
    WHEN JSON_EXTRACT(permissions, '$.canCreateTickets') = true 
    THEN 'Only Completed Tasks'
    ELSE 'No Permissions'
  END as permission_type,
  COUNT(*) as user_count
FROM users
WHERE role = 'user'
GROUP BY permission_type;

-- ==========================================
-- TESTING CHECKLIST
-- ==========================================

/*
✅ Step 1: Run section 1 to see current users
✅ Step 2: Update a test user with ONLY canCallTickets (section 3, query 1)
✅ Step 3: Login as that user, try accessing /user/dashboard → Should work
✅ Step 4: Try accessing /user/completed-tasks → Should redirect to dashboard
✅ Step 5: Logout

✅ Step 6: Update same user with ONLY canCreateTickets (section 3, query 2)
✅ Step 7: Login as that user, try accessing /user/completed-tasks → Should work
✅ Step 8: Try accessing /user/dashboard → Should redirect to completed-tasks
✅ Step 9: Logout

✅ Step 10: Update same user with BOTH permissions (section 3, query 3)
✅ Step 11: Login as that user
✅ Step 12: Try accessing /user/dashboard → Should work
✅ Step 13: Try accessing /user/completed-tasks → Should work
✅ Step 14: Logout

✅ Step 15: Verify all tests passed
✅ Step 16: Check console logs for permission messages
*/
