/*
  # Fix Children SELECT Policy for Public Access

  ## Issue
  The consolidated RLS policy for children SELECT requires authentication,
  but the "Available Children" page should be viewable by anyone (including
  unauthenticated users browsing before signup).

  ## Changes
  1. Drop the existing authenticated-only SELECT policy
  2. Create two separate policies:
     - One for public users to view unsponsored children
     - One for authenticated users to view sponsored children (their own or as admin)
  
  ## Security
  - Public users can ONLY see children with is_sponsored = false
  - Authenticated sponsors can see their sponsored children
  - Admins can see all children
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view children" ON children;

-- Allow anyone (including unauthenticated) to view unsponsored children
CREATE POLICY "Anyone can view unsponsored children"
  ON children FOR SELECT
  TO public
  USING (is_sponsored = false);

-- Allow authenticated users to view their sponsored children and admins to view all
CREATE POLICY "Authenticated users can view sponsored children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
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