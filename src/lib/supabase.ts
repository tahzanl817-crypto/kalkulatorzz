import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://gduhmtbpjuahvbfwmuop.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_9JFoDdG5x9BrqInoefmUYg_na7YRkXp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
