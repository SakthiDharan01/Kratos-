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
          id: number
          name: string
          description: string
          event_type: 'team' | 'solo'
          rules: string
          price: number
          event_date: string
          time_slot: 'slot1' | 'slot2' | 'both'
          slot_duration: 'single' | 'double'
          start_time: string
          end_time: string
          category: 'technical' | 'non-technical' | 'grounds' | 'online' | 'hackathon' | 'pre-events'
          incharge_name1: string
          incharge_phone1: string
          incharge_name2: string
          incharge_phone2: string
          participant_limit: number
          current_registrations: number
          registration_start: string
          registration_end: string
          status: 'open' | 'closed' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          event_type?: 'team' | 'solo'
          rules: string
          price?: number
          event_date: string
          time_slot?: 'slot1' | 'slot2' | 'both'
          slot_duration?: 'single' | 'double'
          start_time?: string
          end_time?: string
          category: 'technical' | 'non-technical' | 'grounds' | 'online' | 'hackathon' | 'pre-events'
          incharge_name1: string
          incharge_phone1: string
          incharge_name2: string
          incharge_phone2: string
          participant_limit?: number
          current_registrations?: number
          registration_start: string
          registration_end: string
          status?: 'open' | 'closed' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          event_type?: 'team' | 'solo'
          rules?: string
          price?: number
          event_date?: string
          time_slot?: 'slot1' | 'slot2' | 'both'
          slot_duration?: 'single' | 'double'
          start_time?: string
          end_time?: string
          category?: 'technical' | 'non-technical' | 'grounds' | 'online' | 'hackathon' | 'pre-events'
          incharge_name1?: string
          incharge_phone1?: string
          incharge_name2?: string
          incharge_phone2?: string
          participant_limit?: number
          current_registrations?: number
          registration_start?: string
          registration_end?: string
          status?: 'open' | 'closed' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: number
          name: string
          email: string
          role: 'user' | 'admin'
          phone: string
          department: string
          year: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          college: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          role?: 'user' | 'admin'
          phone: string
          department: string
          year: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          college: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          role?: 'user' | 'admin'
          phone?: string
          department?: string
          year?: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          college?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      registrants: {
        Row: {
          id: number
          event_id: number
          user_id: number
          team_name: string
          registration_date: string
          payment_status: 'paid' | 'failed' | 'refunded' | 'pending'
          transaction_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          paid_amount: number | null
          payment_method: string | null
          payment_time: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          event_id: number
          user_id: number
          team_name: string
          registration_date?: string
          payment_status?: 'paid' | 'failed' | 'refunded' | 'pending'
          transaction_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_time?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          user_id?: number
          team_name?: string
          registration_date?: string
          payment_status?: 'paid' | 'failed' | 'refunded' | 'pending'
          transaction_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_time?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          college: string
          department: string
          year: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          leader_id: number
          team_name: string
          event_id: number
          is_leader: boolean
          registration_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone: string
          college: string
          department: string
          year: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          leader_id: number
          team_name: string
          event_id: number
          is_leader?: boolean
          registration_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone?: string
          college?: string
          department?: string
          year?: '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Graduate'
          leader_id?: number
          team_name?: string
          event_id?: number
          is_leader?: boolean
          registration_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
