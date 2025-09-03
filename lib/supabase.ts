import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Clean slate - no type definitions yet
// Database types will be generated after creating the schema
export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}