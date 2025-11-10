/*
  # Promesas Sponsor Portal Database Schema

  ## Overview
  This migration creates the complete database schema for the Promesas English Academy
  sponsor portal, including child profiles, sponsorships, progress tracking, and messaging.

  ## New Tables

  ### 1. users_profile
  Extended user profile information
  - `id` (uuid, references auth.users)
  - `role` (text: 'admin' or 'sponsor')
  - `full_name` (text)
  - `country` (text)
  - `profile_photo_url` (text)
  - `preferred_language` (text)
  - `created_at` (timestamptz)

  ### 2. children
  Child profiles for sponsorship
  - `id` (uuid, primary key)
  - `first_name` (text)
  - `last_name` (text)
  - `gender` (text)
  - `birthdate` (date)
  - `photo_url` (text)
  - `location` (text, default 'Quimistán, Honduras')
  - `bio` (text)
  - `english_level` (text)
  - `program_status` (text: 'Enrolled', 'Graduated', 'On Hold')
  - `is_sponsored` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. sponsorships
  Links sponsors to children
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children)
  - `sponsor_id` (uuid, references users_profile)
  - `start_date` (date)
  - `status` (text: 'Active', 'Paused', 'Cancelled')
  - `monthly_amount` (numeric)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 4. progress_updates
  Track child's English learning progress
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children)
  - `title` (text)
  - `description` (text)
  - `english_level_after` (text)
  - `attachments` (jsonb)
  - `created_by` (uuid, references users_profile)
  - `created_at` (timestamptz)

  ### 5. messages
  Communication between sponsors and children (moderated)
  - `id` (uuid, primary key)
  - `child_id` (uuid, references children)
  - `sponsor_id` (uuid, references users_profile)
  - `sender_type` (text: 'Sponsor', 'Staff', 'Child')
  - `content` (text)
  - `status` (text: 'Pending Review', 'Approved', 'Rejected')
  - `created_at` (timestamptz)

  ## Security

  All tables have RLS enabled with appropriate policies based on user roles and ownership.
*/

-- Create users_profile table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'sponsor' CHECK (role IN ('admin', 'sponsor')),
  full_name text NOT NULL,
  country text DEFAULT '',
  profile_photo_url text DEFAULT '',
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  birthdate date NOT NULL,
  photo_url text DEFAULT '',
  location text DEFAULT 'Quimistán, Honduras',
  bio text DEFAULT '',
  english_level text DEFAULT 'Beginner',
  program_status text DEFAULT 'Enrolled' CHECK (program_status IN ('Enrolled', 'Graduated', 'On Hold')),
  is_sponsored boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sponsorships table
CREATE TABLE IF NOT EXISTS sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  start_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled')),
  monthly_amount numeric DEFAULT 35,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(child_id, sponsor_id)
);

-- Create progress_updates table
CREATE TABLE IF NOT EXISTS progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  english_level_after text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('Sponsor', 'Staff', 'Child')),
  content text NOT NULL,
  status text DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can read own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- RLS Policies for children
CREATE POLICY "Public can view unsponsored children"
  ON children FOR SELECT
  TO authenticated, anon
  USING (is_sponsored = false);

CREATE POLICY "Sponsors can view their sponsored children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = children.id
      AND sponsorships.sponsor_id = auth.uid()
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Admins can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update children"
  ON children FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete children"
  ON children FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- RLS Policies for sponsorships
CREATE POLICY "Sponsors can view their sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (sponsor_id = auth.uid());

CREATE POLICY "Sponsors can create sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "Admins can view all sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update sponsorships"
  ON sponsorships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete sponsorships"
  ON sponsorships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- RLS Policies for progress_updates
CREATE POLICY "Sponsors can view progress for their children"
  ON progress_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships
      WHERE sponsorships.child_id = progress_updates.child_id
      AND sponsorships.sponsor_id = auth.uid()
      AND sponsorships.status = 'Active'
    )
  );

CREATE POLICY "Admins can view all progress updates"
  ON progress_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can create progress updates"
  ON progress_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update progress updates"
  ON progress_updates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete progress updates"
  ON progress_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- RLS Policies for messages
CREATE POLICY "Sponsors can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sponsor_id = auth.uid() AND
    (status = 'Approved' OR (sender_type = 'Sponsor' AND status = 'Pending Review'))
  );

CREATE POLICY "Sponsors can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sponsor_id = auth.uid() AND
    sender_type = 'Sponsor' AND
    status = 'Pending Review'
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to children table
DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_children_is_sponsored ON children(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_sponsorships_child_id ON sponsorships(child_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor_id ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_child_id ON progress_updates(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_child_id ON messages(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_sponsor_id ON messages(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);