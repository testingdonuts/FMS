import { createClient } from '@supabase/supabase-js';

// These are public-facing variables, safe to be exposed in a client-side app
const supabaseUrl = 'https://ondftutsbyhfpczwipjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZGZ0dXRzYnloZnBjendpcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDkyNDgsImV4cCI6MjA4Mzg4NTI0OH0.ONZ5X4EmH7_b638jd_vV5LijoyzWCyVDRIEMyTnurWg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or Anon Key are missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);