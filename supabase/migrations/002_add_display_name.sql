-- Add display_name column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Set display_name to username for existing users (if display_name is null)
UPDATE users 
SET display_name = username 
WHERE display_name IS NULL;

-- Create index on display_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

