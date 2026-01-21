-- Update lastLoginAt for all existing users who have null
-- Set it to their createdAt date as a default
UPDATE "User" 
SET "lastLoginAt" = "createdAt" 
WHERE "lastLoginAt" IS NULL;
