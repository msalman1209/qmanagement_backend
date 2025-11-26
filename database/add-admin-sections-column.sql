-- Add admin_sections column to licenses table
ALTER TABLE licenses 
ADD COLUMN admin_sections JSON DEFAULT NULL 
AFTER status;

-- Update existing records with default sections
UPDATE licenses 
SET admin_sections = JSON_OBJECT(
  'services', true,
  'reports', true,
  'configuration', true,
  'counterDisplay', true,
  'users', true,
  'displayScreens', true,
  'userDashboardBtns', true
)
WHERE admin_sections IS NULL;
