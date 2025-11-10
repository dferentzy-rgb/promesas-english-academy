/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Missing Index**
     - Add index on `progress_updates.created_by` foreign key for better query performance

  2. **RLS Policy Performance Optimization**
     - Wrap all `auth.uid()` calls with `(select auth.uid())` to prevent re-evaluation per row
     - This significantly improves query performance at scale

  3. **Function Security**
     - Fix search_path for `update_updated_at_column` function to be immutable

  ## Tables Updated
  - users_profile (4 policies optimized)
  - children (5 policies optimized)
  - sponsorships (6 policies optimized)
  - progress_updates (5 policies optimized + index added)
  - messages (6 policies optimized)
*/

-- ============================================================================
-- 1. ADD MISSING INDEX
-- ============================================================================

-- Add index on progress_updates.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_progress_updates_created_by
  ON progress_updates(created_by);

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Drop and recreate the function with SECURITY INVOKER and explicit search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - users_profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users_profile;

CREATE POLICY "Users can read own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can read all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - children
-- ============================================================================

DROP POLICY IF EXISTS "Public can view unsponsored children" ON children;
DROP POLICY IF EXISTS "Sponsors can view their sponsored children" ON children;
DROP POLICY IF EXISTS "Admins can view all children" ON children;
DROP POLICY IF EXISTS "Admins can insert children" ON children;
DROP POLICY IF EXISTS "Admins can update children" ON children;
DROP POLICY IF EXISTS "Admins can delete children" ON children;

CREATE POLICY "Public can view unsponsored children"
  ON children FOR SELECT
  TO authenticated
  USING (is_sponsored = false);

CREATE POLICY "Sponsors can view their sponsored children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = children.id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Admins can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update children"
  ON children FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete children"
  ON children FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - sponsorships
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view their sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Sponsors can create sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can view all sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can insert sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can update sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can delete sponsorships" ON sponsorships;

CREATE POLICY "Sponsors can view their sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (sponsor_id = (select auth.uid()));

CREATE POLICY "Sponsors can create sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (sponsor_id = (select auth.uid()));

CREATE POLICY "Admins can view all sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update sponsorships"
  ON sponsorships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete sponsorships"
  ON sponsorships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. OPTIMIZE RLS POLICIES - progress_updates
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view progress for their children" ON progress_updates;
DROP POLICY IF EXISTS "Admins can view all progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Admins can create progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Admins can update progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Admins can delete progress updates" ON progress_updates;

CREATE POLICY "Sponsors can view progress for their children"
  ON progress_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = progress_updates.child_id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Admins can view all progress updates"
  ON progress_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create progress updates"
  ON progress_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update progress updates"
  ON progress_updates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete progress updates"
  ON progress_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 7. OPTIMIZE RLS POLICIES - messages
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view their messages" ON messages;
DROP POLICY IF EXISTS "Sponsors can create messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can create messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

CREATE POLICY "Sponsors can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sponsor_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = messages.child_id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Sponsors can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sponsor_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = messages.child_id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );