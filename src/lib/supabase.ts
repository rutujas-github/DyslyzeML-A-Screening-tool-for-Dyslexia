import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Key:', supabaseAnonKey ? 'exists' : 'missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
  organization_type: string;
  organization_name: string;
  created_at: string;
};

export type Screenie = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  grade: string;
  parent_guardian: string;
  contact_number: string;
  reading_test_completed: boolean;
  handwriting_test_completed: boolean;
  created_at: string;
};
