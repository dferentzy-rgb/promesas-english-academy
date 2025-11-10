/*
  # Remove Unused Indexes and Consolidate RLS Policies

  ## Changes Made

  1. **Remove Unused Indexes**
     - Drop 8 unused indexes that have not been utilized
     - Indexes can be re-added later if query patterns require them

  2. **Consolidate Multiple Permissive Policies**
     - Combine multiple permissive policies into single policies per action
     - Improves performance by reducing policy evaluation overhead
     - Maintains the same security model with cleaner implementation

  ## Tables Updated
  - children: Removed 1 index, consolidated 3 SELECT policies
  - sponsorships: Removed 2 indexes, consolidated 2 INSERT + 2 SELECT policies
  - progress_updates: Removed 2 indexes, consolidated 2 SELECT policies
  - messages: Removed 3 indexes, consolidated 2 INSERT + 2 SELECT policies
  - users_profile: Consolidated 2 SELECT policies
*/

-- ============================================================================
-- 1. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_children_is_sponsored;
DROP INDEX IF EXISTS idx_sponsorships_child_id;
DROP INDEX IF EXISTS idx_sponsorships_sponsor_id;
DROP INDEX IF EXISTS idx_progress_updates_child_id;
DROP INDEX IF EXISTS idx_messages_child_id;
DROP INDEX IF EXISTS idx_messages_sponsor_id;
DROP INDEX IF EXISTS idx_messages_status;
DROP INDEX IF EXISTS idx_progress_updates_created_by;

-- ============================================================================
-- 2. CONSOLIDATE RLS POLICIES - users_profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users_profile;

CREATE POLICY "Users can read profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = (select auth.uid())
      AND up.role = 'admin'
    )
  );

-- ============================================================================
-- 3. CONSOLIDATE RLS POLICIES - children
-- ============================================================================

DROP POLICY IF EXISTS "Public can view unsponsored children" ON children;
DROP POLICY IF EXISTS "Sponsors can view their sponsored children" ON children;
DROP POLICY IF EXISTS "Admins can view all children" ON children;

CREATE POLICY "Users can view children"
  ON children FOR SELECT
  TO authenticated
  USING (
    is_sponsored = false
    OR EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = children.id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. CONSOLIDATE RLS POLICIES - sponsorships
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view their sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can view all sponsorships" ON sponsorships;

CREATE POLICY "Users can view sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (
    sponsor_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Sponsors can create sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admins can insert sponsorships" ON sponsorships;

CREATE POLICY "Users can create sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (
    sponsor_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. CONSOLIDATE RLS POLICIES - progress_updates
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view progress for their children" ON progress_updates;
DROP POLICY IF EXISTS "Admins can view all progress updates" ON progress_updates;

CREATE POLICY "Users can view progress updates"
  ON progress_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = progress_updates.child_id
      AND sponsorships.sponsor_id = (select auth.uid())
      AND sponsorships.status = 'Active'
    )
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. CONSOLIDATE RLS POLICIES - messages
-- ============================================================================

DROP POLICY IF EXISTS "Sponsors can view their messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;

CREATE POLICY "Users can view messages"
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
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Sponsors can create messages" ON messages;
DROP POLICY IF EXISTS "Admins can create messages" ON messages;

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      sponsor_id = (select auth.uid())
      AND EXISTS (
        SELECT 1 FROM sponsorships
        WHERE sponsorships.child_id = messages.child_id
        AND sponsorships.sponsor_id = (select auth.uid())
        AND sponsorships.status = 'Active'
      )
    )
    OR EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );