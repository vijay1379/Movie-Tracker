/*
  # Add last_login to users table

  1. Changes
    - Add last_login column to users table
    - Update existing users with current timestamp
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
    UPDATE users SET last_login = CURRENT_TIMESTAMP;
  END IF;
END $$;