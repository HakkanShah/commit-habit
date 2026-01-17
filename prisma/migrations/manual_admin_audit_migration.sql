-- ============================================================================
-- Admin Panel Migration
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add role and lastLoginAt to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- 2. Modify Testimonial table: replace approved with status, add editing fields
-- First, add the new columns
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "editedContent" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "editedBy" TEXT;

-- Migrate existing data: if approved=true, set status='APPROVED', else 'PENDING'
UPDATE "Testimonial" SET "status" = 'APPROVED' WHERE "approved" = true;
UPDATE "Testimonial" SET "status" = 'PENDING' WHERE "approved" = false;

-- Drop the old approved column and its index
DROP INDEX IF EXISTS "Testimonial_approved_featured_idx";
ALTER TABLE "Testimonial" DROP COLUMN IF EXISTS "approved";

-- Create new index for status
CREATE INDEX IF NOT EXISTS "Testimonial_status_featured_idx" ON "Testimonial"("status", "featured");

-- 3. Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "AuditLog" 
    ADD CONSTRAINT "AuditLog_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Create indexes for AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Disable RLS on AuditLog (access is controlled by server-side API routes, not Supabase client)
-- This is safe because:
-- 1. All DB access goes through Prisma in Next.js API routes
-- 2. The app uses the service_role connection string (bypasses RLS anyway)
-- 3. No direct client-side Supabase access to this table
ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification queries (run these to confirm changes worked)
-- ============================================================================

-- Check User table columns
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'User';

-- Check Testimonial table columns  
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'Testimonial';

-- Check AuditLog table exists
-- SELECT * FROM "AuditLog" LIMIT 1;
