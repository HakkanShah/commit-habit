-- Enable Row Level Security on all tables
-- Since we use Prisma (server-side with service role), we allow full access for authenticated service role
-- This satisfies Supabase security requirements while maintaining Prisma functionality

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Account table  
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Installation table
ALTER TABLE "Installation" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ActivityLog table
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on _prisma_migrations table (Prisma internal)
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow the service role (used by Prisma) full access
-- The postgres role (service_role) bypasses RLS by default, but we add explicit policies for clarity

-- User table policies
CREATE POLICY "service_role_all_user" ON "User"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Account table policies
CREATE POLICY "service_role_all_account" ON "Account"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Installation table policies
CREATE POLICY "service_role_all_installation" ON "Installation"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- ActivityLog table policies
CREATE POLICY "service_role_all_activitylog" ON "ActivityLog"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- _prisma_migrations table policies
CREATE POLICY "service_role_all_prisma_migrations" ON "_prisma_migrations"
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);
