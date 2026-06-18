import { createClient } from '@supabase/supabase-js'

// Client-side supabase (safe to use in browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)