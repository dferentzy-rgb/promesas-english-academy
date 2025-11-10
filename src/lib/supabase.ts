import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  role: 'admin' | 'sponsor';
  full_name: string;
  country: string;
  profile_photo_url: string;
  preferred_language: string;
  created_at: string;
};

export type Child = {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female';
  birthdate: string;
  photo_url: string;
  location: string;
  bio: string;
  english_level: string;
  program_status: 'Enrolled' | 'Graduated' | 'On Hold';
  is_sponsored: boolean;
  created_at: string;
  updated_at: string;
};

export type Sponsorship = {
  id: string;
  child_id: string;
  sponsor_id: string;
  start_date: string;
  status: 'Active' | 'Paused' | 'Cancelled';
  monthly_amount: number;
  notes: string;
  created_at: string;
};

export type ProgressUpdate = {
  id: string;
  child_id: string;
  title: string;
  description: string;
  english_level_after: string;
  attachments: any[];
  created_by: string;
  created_at: string;
};

export type Message = {
  id: string;
  child_id: string;
  sponsor_id: string;
  sender_type: 'Sponsor' | 'Staff' | 'Child';
  content: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  created_at: string;
};
