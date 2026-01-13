import { createClient } from '@supabase/supabase-js';

// These are public-facing variables, safe to be exposed in a client-side app
const supabaseUrl = 'https://csrgvtsfhixzmfmatiak.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcmd2dHNmaGl4em1mbWF0aWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MDEzOTAsImV4cCI6MjA3NzM3NzM5MH0.ALy12_fvKYplxa-2EToKm1t0iX8fC52KBpWnjtPRkqk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or Anon Key are missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);