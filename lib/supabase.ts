import { createClient } from '@supabase/supabase-js'
// supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          name: string
          email: string
          college: string
          department: string
          year: string
          created_at: string
          photo_url: string | null
        }
        Insert: {
          id?: string
          phone: string
          name: string
          email: string
          college: string
          department: string
          year: string
          created_at?: string
          photo_url?: string | null
        }
        Update: {
          id?: string
          phone?: string
          name?: string
          email?: string
          college?: string
          department?: string
          year?: string
          created_at?: string
          photo_url?: string | null
        }
      }
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
          user_id: string
          total_amount: number
          status: string
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status: string
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: string
          payment_id?: string | null
          created_at?: string
        }
      }
      registration_participants: {
        Row: {
          id: string
          registration_id: string
          event_id: string
          name: string
          email: string
          phone: string
          college: string | null
          department: string | null
          year: string | null
          is_leader: boolean
          created_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          event_id: string
          name: string
          email: string
          phone: string
          college?: string | null
          department?: string | null
          year?: string | null
          is_leader: boolean
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          event_id?: string
          name?: string
          email?: string
          phone?: string
          college?: string | null
          department?: string | null
          year?: string | null
          is_leader?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          events: any[]
          participants: any[]
          total_amount: number
          receipt_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          events: any[]
          participants: any[]
          total_amount: number
          receipt_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          events?: any[]
          participants?: any[]
          total_amount?: number
          receipt_id?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}