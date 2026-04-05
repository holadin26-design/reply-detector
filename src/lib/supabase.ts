import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('CRITICAL: Supabase environment variables are missing.');
}

// Use service role key for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseServiceRoleKey || 'missing-key', 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

// Regular client for potential client-side use
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnonKey || 'missing-key'
);
