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
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string
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
          price?: number
          min_team_size?: number
          max_team_size?: number
          category?: string
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