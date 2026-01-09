-- Fix RLS policies to allow all roles used by Supabase/Prisma
-- The issue was policies only allowed 'postgres' role but connection might use other roles

-- Drop the old policies that only targeted postgres
DROP POLICY IF EXISTS "service_role_all_user" ON "User";
DROP POLICY IF EXISTS "service_role_all_account" ON "Account";
DROP POLICY IF EXISTS "service_role_all_installation" ON "Installation";
DROP POLICY IF EXISTS "service_role_all_activitylog" ON "ActivityLog";
DROP POLICY IF EXISTS "service_role_all_prisma_migrations" ON "_prisma_migrations";

-- Create permissive policies for ALL roles (since we only access via server-side Prisma)
-- This allows any authenticated database connection to access the tables

-- User table - allow all operations for any role
CREATE POLICY "allow_all_user" ON "User"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Account table - allow all operations for any role
CREATE POLICY "allow_all_account" ON "Account"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Installation table - allow all operations for any role
CREATE POLICY "allow_all_installation" ON "Installation"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ActivityLog table - allow all operations for any role  
CREATE POLICY "allow_all_activitylog" ON "ActivityLog"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- _prisma_migrations table - allow all operations for any role
CREATE POLICY "allow_all_prisma_migrations" ON "_prisma_migrations"
  FOR ALL
  USING (true)
  WITH CHECK (true);
