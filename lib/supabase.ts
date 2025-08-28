import { createClient } from '@supabase/supabase-js'
// supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          description: string
          rules: string | null
          price: number
          min_team_size: number
          max_team_size: number
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          rules?: string | null
          price: number
          min_team_size: number
          max_team_size: number
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          rules?: string | null
          price?: number
          min_team_size?: number
          max_team_size?: number
          category?: string
          created_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          event_id: string
          team_name: string
          leader_id: string
          leader_name: string
          leader_email: string
          leader_phone: string
          status: string
          order_id: string | null
          email_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          team_name: string
          leader_id: string
          leader_name: string
          leader_email: string
          leader_phone: string
          status?: string
          order_id?: string | null
          email_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          team_name?: string
          leader_id?: string
          leader_name?: string
          leader_email?: string
          leader_phone?: string
          status?: string
          order_id?: string | null
          email_sent?: boolean
          created_at?: string
        }
      }
      registrants: {
        Row: {
          id: string
          registration_id: string
          name: string
          email: string
          phone: string
          college: string
          department: string
          year: string
          is_leader: boolean
          created_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          name: string
          email: string
          phone: string
          college: string
          department: string
          year: string
          is_leader?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          name?: string
          email?: string
          phone?: string
          college?: string
          department?: string
          year?: string
          is_leader?: boolean
          created_at?: string
        }
      }
    }
  }
}