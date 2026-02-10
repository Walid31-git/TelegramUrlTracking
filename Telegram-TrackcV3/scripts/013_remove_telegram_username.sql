-- Remove telegram_username column from promoters table
ALTER TABLE promoters DROP COLUMN IF EXISTS telegram_username;
