-- ============================================================================
-- Admin Panel Enhancement Migration
-- Run these queries in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Add soft-delete fields to User table
-- ============================================================================
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Create index for efficient filtering of deleted users
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- ============================================================================
-- 2. Add admin tracking fields to AuditLog table
-- ============================================================================
ALTER TABLE "AuditLog"
ADD COLUMN IF NOT EXISTS "actorType" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;

-- Create index for filtering by actor type
CREATE INDEX IF NOT EXISTS "AuditLog_actorType_idx" ON "AuditLog"("actorType");

-- ============================================================================
-- 3. Verify the changes
-- ============================================================================
-- Run these to verify the columns were added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'AuditLog';
